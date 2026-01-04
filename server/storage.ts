import { db } from "./db";
import {
  users, products, purchases, sales, saleItems, expenses,
  type User, type InsertUser, type Product, type Purchase,
  type Sale, type SaleItem, type Expense
} from "@shared/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: typeof products.$inferInsert): Promise<Product>;
  updateProduct(id: number, product: Partial<typeof products.$inferInsert>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Purchases
  createPurchase(purchase: typeof purchases.$inferInsert): Promise<Purchase>;
  getPurchases(): Promise<(Purchase & { product: Product })[]>;

  // Sales
  createSale(userId: number, items: { productId: number; quantity: number; rate: number }[]): Promise<Sale>;
  getSales(): Promise<(Sale & { user: User })[]>;

  // Expenses
  createExpense(expense: typeof expenses.$inferInsert): Promise<Expense>;
  getExpenses(): Promise<Expense[]>;

  // Stats
  getDailyStats(): Promise<{ sales: number; purchases: number; expenses: number }>;
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
      
      // Update stock
      const [product] = await tx.select().from(products).where(eq(products.id, purchase.productId));
      if (product) {
        await tx.update(products)
          .set({ stock: sql`${products.stock} + ${purchase.quantity}` })
          .where(eq(products.id, purchase.productId));
      }
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
      
      // Calculate total and prepare items
      const saleItemsData = items.map(item => {
        const amount = item.quantity * item.rate;
        totalAmount += amount;
        return {
          saleId: 0, // Placeholder
          productId: item.productId,
          quantity: item.quantity,
          rate: item.rate,
          amount: Math.round(amount), // Ensure integer
        };
      });

      // Create Sale
      const [newSale] = await tx.insert(sales).values({
        userId,
        totalAmount: Math.round(totalAmount),
      }).returning();

      // Insert Items
      for (const item of saleItemsData) {
        item.saleId = newSale.id;
        await tx.insert(saleItems).values(item);
        
        // Deduct Stock
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

  async getDailyStats(): Promise<{ sales: number; purchases: number; expenses: number }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [salesResult] = await db.select({ total: sql<number>`sum(${sales.totalAmount})` })
      .from(sales)
      .where(and(gte(sales.date, startOfDay), lte(sales.date, endOfDay)));

    const [purchasesResult] = await db.select({ total: sql<number>`sum(${purchases.totalAmount})` })
      .from(purchases)
      .where(and(gte(purchases.date, startOfDay), lte(purchases.date, endOfDay)));

    const [expensesResult] = await db.select({ total: sql<number>`sum(${expenses.amount})` })
      .from(expenses)
      .where(and(gte(expenses.date, startOfDay), lte(expenses.date, endOfDay)));

    return {
      sales: salesResult?.total || 0,
      purchases: purchasesResult?.total || 0,
      expenses: expensesResult?.total || 0,
    };
  }
}

export const storage = new DatabaseStorage();
