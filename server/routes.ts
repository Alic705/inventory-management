import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, seedAdmin } from "./auth";
import { api } from "@shared/routes";
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
      res.json({ isAuthenticated: req.isAuthenticated(), user: req.user, cookies: req.headers.cookie, sessionID: (req as any).sessionID, session: (req as any).session });
    });

    // dev helper to list users
    app.get('/api/debug/users', async (_req, res) => {
      const users = await storage.getUsers();
      res.json(users);
    });

    // dev helper to create a fresh admin (password: admin123)
    app.post('/api/debug/create-admin', async (_req, res) => {
      const { scrypt, randomBytes } = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(scrypt);
      const salt = randomBytes(16).toString('hex');
      const buf = (await scryptAsync('admin123', salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString('hex')}.${salt}`;
      try {
        const user = await storage.createUser({ username: 'admin', password: hashedPassword, role: 'admin', language: 'en', isActive: true });
        res.status(201).json(user);
      } catch (err: any) {
        res.status(400).json({ message: err.message || 'create admin failed' });
      }
    });
  }

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // Products
  app.get(api.products.list.path, requireAuth, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post(api.products.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
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
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      res.json(product);
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.delete(api.products.delete.path, requireAuth, async (req, res) => {
    try {
      await storage.deleteProduct(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // Purchases
  app.get(api.purchases.list.path, requireAuth, async (req, res) => {
    const purchases = await storage.getPurchases();
    res.json(purchases);
  });

  app.post(api.purchases.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.purchases.create.input.parse(req.body);
      const purchase = await storage.createPurchase(input);
      res.status(201).json(purchase);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.put(api.purchases.update.path, requireAuth, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.sendStatus(403);
    try {
      const input = api.purchases.update.input.parse(req.body);
      const purchase = await storage.updatePurchase(Number(req.params.id), input);
      res.json(purchase);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(400).json({ message: "Update failed" });
      }
    }
  });

  app.delete(api.purchases.delete.path, requireAuth, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.sendStatus(403);
    try {
      await storage.deletePurchase(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // Sales
  app.get(api.sales.list.path, requireAuth, async (req, res) => {
    const sales = await storage.getSales();
    res.json(sales);
  });

  app.post(api.sales.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.sales.create.input.parse(req.body);
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const sale = await storage.createSale(req.user.id, input.items);
      res.status(201).json(sale);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  // Expenses
  app.get(api.expenses.list.path, requireAuth, async (req, res) => {
    try {
      console.log('[api] GET /api/expenses headers.cookie:', req.headers.cookie, 'isAuthenticated:', req.isAuthenticated(), 'user:', req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null);
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const { userId: userIdParam, admin } = req.query as {
        userId?: string;
        admin?: string;
      };

      let userId: number | null | undefined = undefined;
      const isAdmin = req.user.role === 'admin';

      if (isAdmin) {
        if (admin === 'true') {
          // frontend admin filter → admin-only expenses
          userId = null;
        } else if (userIdParam && userIdParam !== 'all') {
          userId = Number(userIdParam);
        }
        // else: show all expenses
      } else {
        // staff can only see their own expenses
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
      console.log('[api] POST /api/expenses headers.cookie:', req.headers.cookie, 'isAuthenticated:', req.isAuthenticated(), 'user:', req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null, 'body:', req.body);
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const input = api.expenses.create.input.parse(req.body);
      // If staff user, automatically set userId to their ID
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

  app.put(api.expenses.update.path, requireAuth, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.sendStatus(403);
    try {
      const input = api.expenses.update.input.parse(req.body);
      const expense = await storage.updateExpense(Number(req.params.id), input);
      res.json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(400).json({ message: "Update failed" });
      }
    }
  });

  app.delete(api.expenses.delete.path, requireAuth, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.sendStatus(403);
    try {
      await storage.deleteExpense(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // Users
  app.get(api.users.list.path, requireAuth, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.sendStatus(403);
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (err) {
      throw err;
    }
  });

  app.post(api.users.create.path, requireAuth, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.sendStatus(403);
    try {
      const input = api.users.create.input.parse(req.body);
      // Hash password using crypto module
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(input.password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

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

  app.put(api.users.update.path, requireAuth, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.sendStatus(403);
    try {
      const input = api.users.update.input.parse(req.body);
      const updateData: any = { ...input };

      // Only hash password if it's provided
      if (input.password && input.password.trim() !== '') {
        const { scrypt, randomBytes } = await import("crypto");
        const { promisify } = await import("util");
        const scryptAsync = promisify(scrypt);
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(input.password, salt, 64)) as Buffer;
        updateData.password = `${buf.toString("hex")}.${salt}`;
      } else {
        delete updateData.password;
      }

      const user = await storage.updateUser(Number(req.params.id), updateData);
      (req.session as any).user = {
        id: user.id,
        username: user.username,
      };
      res.json(user);

    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(400).json({ message: "Update failed" });
      }
    }
  });

  app.delete(api.users.delete.path, requireAuth, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.sendStatus(403);
    try {
      await storage.deleteUser(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // Stats
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
        profit: stats.sales - (stats.purchases + stats.expenses), // Rough estimate
        weeklySales: stats.weeklySales,
      });
    } catch (err) {
      throw err;
    }
  });

  return httpServer;
}
