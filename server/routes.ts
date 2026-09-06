import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, seedAdmin, hashPassword } from "./auth";
import { api } from "@shared/routes";
import {
  insertClientSchema,
  insertClientPaymentSchema,
  insertUserSchema,
  insertProductSchema,
  insertPurchaseSchema,
  insertExpenseSchema,
  createSaleSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  await seedAdmin();

  // Dev-only debug endpoint to inspect session/test auth
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug/session', (req, res) => {
      res.json({
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
        cookies: req.headers.cookie,
        sessionID: (req as any).sessionID,
        session: (req as any).session
      });
    });

    // dev helper to list users
    app.get('/api/debug/users', async (_req, res) => {
      const users = await storage.getUsers();
      res.json(users);
    });
  }

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check admin role
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  };

  // ==================== PRODUCTS ====================
  app.get(api.products.list.path, requireAuth, async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post(api.products.create.path, requireAuth, async (req, res) => {
    try {
      const input = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.put(api.products.update.path, requireAuth, async (req, res) => {
    try {
      const input = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, input);
      res.json(product);
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.delete(api.products.delete.path, requireAuth, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.sendStatus(204);
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // ==================== PURCHASES ====================
  app.get(api.purchases.list.path, requireAuth, async (_req, res) => {
    const purchases = await storage.getPurchases();
    res.json(purchases);
  });

  app.post(api.purchases.create.path, requireAuth, async (req, res) => {
    try {
      if (req.body.clientId === "none" || req.body.clientId === "") {
        req.body.clientId = null;
      }
      const input = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(input);
      res.status(201).json(purchase);
    } catch (err: any) {
      console.error("Purchase creation error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0]?.message || "Invalid purchase data" });
      } else {
        res.status(400).json({ message: err.message || "Failed to record purchase" });
      }
    }
  });

  app.put(api.purchases.update.path, requireAdmin, async (req, res) => {
    try {
      if (req.body.clientId === "none" || req.body.clientId === "") {
        req.body.clientId = null;
      }
      const input = insertPurchaseSchema.partial().parse(req.body);
      const purchase = await storage.updatePurchase(req.params.id, input);
      res.json(purchase);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0]?.message || "Invalid purchase update" });
      } else {
        res.status(400).json({ message: err.message || "Update failed" });
      }
    }
  });

  app.delete(api.purchases.delete.path, requireAdmin, async (req, res) => {
    try {
      await storage.deletePurchase(req.params.id);
      res.sendStatus(204);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Delete failed" });
    }
  });

  // ==================== SALES ====================
  app.get(api.sales.list.path, requireAuth, async (_req, res) => {
    const sales = await storage.getSales();
    res.json(sales);
  });

  app.post(api.sales.create.path, requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      if (req.body.clientId === "walk-in" || req.body.clientId === "none" || req.body.clientId === "") {
        req.body.clientId = null;
      }
      const input = createSaleSchema.parse(req.body);
      const sale = await storage.createSale(req.user.id, input.items, input.clientId);
      res.status(201).json(sale);
    } catch (err: any) {
      console.error("Sale creation error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0]?.message || "Invalid sale data" });
      } else {
        res.status(400).json({ message: err.message || "Failed to create sale" });
      }
    }
  });

  // ==================== EXPENSES ====================
  app.get(api.expenses.list.path, requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const { userId: userIdParam, admin } = req.query as {
        userId?: string;
        admin?: string;
      };

      let userId: string | null | undefined = undefined;
      const isAdmin = req.user.role === 'admin';

      if (isAdmin) {
        if (admin === 'true') {
          userId = null;
        } else if (userIdParam && userIdParam !== 'all') {
          userId = userIdParam;
        }
      } else {
        userId = req.user.id;
      }

      const expenses = await storage.getExpenses(userId, isAdmin);
      res.json(expenses);
    } catch (err) {
      throw err;
    }
  });

  app.post(api.expenses.create.path, requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const input = insertExpenseSchema.parse(req.body);
      const expenseData = req.user.role === 'admin'
        ? input
        : { ...input, userId: req.user.id };
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.put(api.expenses.update.path, requireAdmin, async (req, res) => {
    try {
      const input = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, input);
      res.json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(400).json({ message: "Update failed" });
      }
    }
  });

  app.delete(api.expenses.delete.path, requireAdmin, async (req, res) => {
    try {
      await storage.deleteExpense(req.params.id);
      res.sendStatus(204);
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // ==================== CLIENT MANAGEMENT (ADMIN ONLY) ====================
  app.get(api.clients.list.path, requireAdmin, async (_req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch clients" });
    }
  });

  app.get(api.clients.get.path, requireAdmin, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch client" });
    }
  });

  app.post(api.clients.create.path, requireAdmin, async (req, res) => {
    try {
      const input = insertClientSchema.parse(req.body);
      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to create client" });
      }
    }
  });

  app.put(api.clients.update.path, requireAdmin, async (req, res) => {
    try {
      const input = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, input);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(400).json({ message: "Update failed" });
      }
    }
  });

  app.delete(api.clients.delete.path, requireAdmin, async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.sendStatus(204);
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // Client Details & Ledger with Date Filter
  app.get(api.clients.transactions.path, requireAdmin, async (req, res) => {
    try {
      const filter = (req.query.filter as string) || "all";
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const summary = await storage.getClientTransactions(req.params.id, filter, from, to);
      res.json(summary);
    } catch (err: any) {
      res.status(404).json({ message: err.message || "Failed to fetch client transactions" });
    }
  });

  // Record Payment for Client
  app.post(api.clients.createPayment.path, requireAdmin, async (req, res) => {
    try {
      const paymentSchema = insertClientPaymentSchema.omit({ clientId: true });
      const input = paymentSchema.parse(req.body);

      const payment = await storage.createClientPayment({
        ...input,
        clientId: req.params.id,
        userId: req.user?.id,
        date: input.date ? new Date(input.date) : new Date(),
      });

      res.status(201).json(payment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to record payment" });
      }
    }
  });

  // Delete Payment record
  app.delete(api.clients.deletePayment.path, requireAdmin, async (req, res) => {
    try {
      await storage.deleteClientPayment(req.params.paymentId);
      res.sendStatus(204);
    } catch (err) {
      res.status(400).json({ message: "Failed to delete payment" });
    }
  });

  // ==================== USERS (ADMIN ONLY) ====================
  app.get(api.users.list.path, requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (err) {
      throw err;
    }
  });

  app.post(api.users.create.path, requireAdmin, async (req, res) => {
    try {
      const input = insertUserSchema.parse(req.body);
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.put(api.users.update.path, requireAdmin, async (req, res) => {
    try {
      const input = insertUserSchema.partial().parse(req.body);
      const updateData: any = { ...input };

      if (input.password && input.password.trim() !== '') {
        updateData.password = await hashPassword(input.password);
      } else {
        delete updateData.password;
      }

      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(400).json({ message: "Update failed" });
      }
    }
  });

  app.delete(api.users.delete.path, requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.sendStatus(204);
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // ==================== STATS ====================
  app.get(api.stats.get.path, requireAuth, async (req, res) => {
    try {
      const filter = req.query.filter as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const stats = await storage.getDailyStats(filter, from, to);
      res.json({
        dailySales: stats.sales,
        dailyPurchases: stats.purchases,
        dailyExpenses: stats.expenses,
        profit: stats.sales - (stats.purchases + stats.expenses),
        weeklySales: stats.weeklySales,
      });
    } catch (err) {
      throw err;
    }
  });

  return httpServer;
}
