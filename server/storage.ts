import { db } from "./db";
import {
  users, products, purchases, sales, saleItems, expenses,
  type User, type InsertUser, type Product, type Purchase,
  type Sale, type SaleItem, type Expense
} from "@shared/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: typeof products.$inferInsert): Promise<Product>;
  updateProduct(id: number, product: Partial<typeof products.$inferInsert>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  createPurchase(purchase: typeof purchases.$inferInsert): Promise<Purchase>;
  getPurchases(): Promise<(Purchase & { product: Product })[]>;
  createSale(userId: number, items: { productId: number; quantity: number; rate: number }[]): Promise<Sale>;
  getSales(): Promise<(Sale & { user: User })[]>;
  createExpense(expense: typeof expenses.$inferInsert): Promise<Expense>;
  getExpenses(): Promise<Expense[]>;
  getDailyStats(): Promise<{ sales: number; purchases: number; expenses: number; weeklySales: { date: string, amount: number }[] }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: typeof products.$inferInsert): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<typeof products.$inferInsert>): Promise<Product> {
    const [updated] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async createPurchase(purchase: typeof purchases.$inferInsert): Promise<Purchase> {
    return await db.transaction(async (tx) => {
      const [newPurchase] = await tx.insert(purchases).values(purchase).returning();
      await tx.update(products)
        .set({ stock: sql`${products.stock} + ${purchase.quantity}` })
        .where(eq(products.id, purchase.productId));
      return newPurchase;
    });
  }

  async getPurchases(): Promise<(Purchase & { product: Product })[]> {
    const rows = await db.select().from(purchases)
      .leftJoin(products, eq(purchases.productId, products.id))
      .orderBy(desc(purchases.date));
    return rows.map(r => ({ ...r.purchases, product: r.products! }));
  }

  async createSale(userId: number, items: { productId: number; quantity: number; rate: number }[]): Promise<Sale> {
    return await db.transaction(async (tx) => {
      let totalAmount = 0;
      items.forEach(item => totalAmount += item.quantity * item.rate);
      const [newSale] = await tx.insert(sales).values({ userId, totalAmount: Math.round(totalAmount) }).returning();
      for (const item of items) {
        await tx.insert(saleItems).values({
          saleId: newSale.id,
          productId: item.productId,
          quantity: item.quantity,
          rate: item.rate,
          amount: Math.round(item.quantity * item.rate),
        });
        await tx.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
      return newSale;
    });
  }

  async getSales(): Promise<(Sale & { user: User })[]> {
    const rows = await db.select().from(sales)
      .leftJoin(users, eq(sales.userId, users.id))
      .orderBy(desc(sales.date));
    return rows.map(r => ({ ...r.sales, user: r.users! }));
  }

  async createExpense(expense: typeof expenses.$inferInsert): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getDailyStats(): Promise<{ sales: number; purchases: number; expenses: number; weeklySales: { date: string, amount: number }[] }> {
    // Use PostgreSQL date casting to properly compare dates (handles timezone correctly)
    const [sResult] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
      .from(sales).where(sql`${sales.date}::date = CURRENT_DATE`);
    const [pResult] = await db.select({ total: sql<number>`COALESCE(SUM(${purchases.totalAmount}), 0)` })
      .from(purchases).where(sql`${purchases.date}::date = CURRENT_DATE`);
    const [eResult] = await db.select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses).where(sql`${expenses.date}::date = CURRENT_DATE`);

    const weeklySales = [];
    for (let i = 6; i >= 0; i--) {
      const [res] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
        .from(sales).where(sql`${sales.date}::date = CURRENT_DATE - INTERVAL '${sql.raw(String(i))} days'`);
      const date = new Date();
      date.setDate(date.getDate() - i);
      weeklySales.push({ date: date.toLocaleDateString('en-US', { weekday: 'short' }), amount: Number(res?.total || 0) });
    }

    return {
      sales: Number(sResult?.total || 0),
      purchases: Number(pResult?.total || 0),
      expenses: Number(eResult?.total || 0),
      weeklySales
    };
  }
}

export const storage = new DatabaseStorage();
