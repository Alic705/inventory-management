import type { Express } from "express";
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
  seedAdmin();

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
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
    await storage.deleteProduct(Number(req.params.id));
    res.sendStatus(204);
  });

  // Purchases
  app.get(api.purchases.list.path, requireAuth, async (req, res) => {
    const purchases = await storage.getPurchases();
    res.json(purchases);
  });

  app.post(api.purchases.create.path, requireAuth, async (req, res) => {
    const input = api.purchases.create.input.parse(req.body);
    const purchase = await storage.createPurchase(input);
    res.status(201).json(purchase);
  });

  // Sales
  app.get(api.sales.list.path, requireAuth, async (req, res) => {
    const sales = await storage.getSales();
    res.json(sales);
  });

  app.post(api.sales.create.path, requireAuth, async (req, res) => {
    // Manually parse complex input for now or use schema
    // Input: { items: [{ productId, quantity, rate }] }
    const items = req.body.items;
    if (!items || !Array.isArray(items)) return res.status(400).send("Invalid items");
    
    const sale = await storage.createSale(req.user!.id, items);
    res.status(201).json(sale);
  });

  // Expenses
  app.get(api.expenses.list.path, requireAuth, async (req, res) => {
    const expenses = await storage.getExpenses();
    res.json(expenses);
  });

  app.post(api.expenses.create.path, requireAuth, async (req, res) => {
    const input = api.expenses.create.input.parse(req.body);
    const expense = await storage.createExpense(input);
    res.status(201).json(expense);
  });

  // Users
  app.get(api.users.list.path, requireAuth, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post(api.users.create.path, requireAuth, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const input = api.users.create.input.parse(req.body);
    // Hash password handled in storage? No, normally in service/route.
    // NOTE: In a real app, hash here.
    // For this MVP, I'll update the createUser in storage to NOT hash, but I should hash it here or helper.
    // See auth.ts for hash helper. 
    // I cannot easily import hashPassword from auth.ts because of circular deps if not careful.
    // Let's assume for now we store as is or I duplicate hash logic.
    // I will quickly move hash logic to a utils file or just import it.
    // Since I can't edit auth.ts in this batch easily (I'm writing it now), I'll skip hashing for new users in this turn 
    // OR I can use the crypto module directly here.
    
    const { scrypt, randomBytes } = await import("crypto");
    const { promisify } = await import("util");
    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(input.password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    const user = await storage.createUser({ ...input, password: hashedPassword });
    res.status(201).json(user);
  });

  // Stats
  app.get(api.stats.get.path, requireAuth, async (req, res) => {
    const stats = await storage.getDailyStats();
    res.json({
      dailySales: stats.sales,
      dailyPurchases: stats.purchases,
      dailyExpenses: stats.expenses,
      profit: stats.sales - (stats.purchases + stats.expenses), // Rough estimate
    });
  });

  return httpServer;
}
