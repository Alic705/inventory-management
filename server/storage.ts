import { db } from "./db";
import {
  users, products, purchases, sales, saleItems, expenses,
  type User, type Product, type Purchase,
  type Sale, type SaleItem, type Expense
} from "@shared/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: typeof users.$inferInsert): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<typeof users.$inferInsert>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: typeof products.$inferInsert): Promise<Product>;
  updateProduct(id: number, product: Partial<typeof products.$inferInsert>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  createPurchase(purchase: typeof purchases.$inferInsert): Promise<Purchase>;
  updatePurchase(id: number, purchase: Partial<typeof purchases.$inferInsert>): Promise<Purchase>;
  deletePurchase(id: number): Promise<void>;
  getPurchases(): Promise<(Purchase & { product: Product })[]>;
  createSale(userId: number, items: { productId: number; quantity: number; rate: number }[]): Promise<Sale>;
  getSales(): Promise<(Sale & { user: User })[]>;
  createExpense(expense: typeof expenses.$inferInsert): Promise<Expense>;
  updateExpense(id: number, expense: Partial<typeof expenses.$inferInsert>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  getExpenses(userId?: number | null, isAdmin?: boolean): Promise<(Expense & { user?: User })[]>;
  getDailyStats(filter?: string, fromDate?: string, toDate?: string): Promise<{ sales: number; purchases: number; expenses: number; weeklySales: { date: string, amount: number }[] }>;
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

  async createUser(user: typeof users.$inferInsert): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, updates: Partial<typeof users.$inferInsert>): Promise<User> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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

  async updatePurchase(id: number, updates: Partial<typeof purchases.$inferInsert>): Promise<Purchase> {
    const [updated] = await db.update(purchases).set(updates).where(eq(purchases.id, id)).returning();
    return updated;
  }

  async deletePurchase(id: number): Promise<void> {
    await db.delete(purchases).where(eq(purchases.id, id));
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

  async updateExpense(id: number, updates: Partial<typeof expenses.$inferInsert>): Promise<Expense> {
    const [updated] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getExpenses(userId?: number | null, isAdmin?: boolean): Promise<(Expense & { user?: User })[]> {
    let rows;

    if (!isAdmin && userId) {
      // Staff can only see their own expenses
      rows = await db.select().from(expenses)
        .where(eq(expenses.userId, userId))
        .orderBy(desc(expenses.date));
    } else if (isAdmin && userId !== undefined && userId !== null) {
      // Admin filtering by specific user
      rows = await db.select().from(expenses)
        .where(eq(expenses.userId, userId))
        .orderBy(desc(expenses.date));
    } else if (isAdmin && userId === null) {
      // Admin viewing admin-only expenses (userId is null)
      rows = await db.select().from(expenses)
        .where(sql`${expenses.userId} IS NULL`)
        .orderBy(desc(expenses.date));
    } else {
      // Admin viewing all expenses
      rows = await db.select().from(expenses)
        .orderBy(desc(expenses.date));
    }

    // Join with users to get user info
    const expensesWithUsers = await Promise.all(rows.map(async (exp) => {
      if (exp.userId) {
        const user = await this.getUser(exp.userId);
        return { ...exp, user };
      }
      return { ...exp };
    }));

    return expensesWithUsers;
  }

  async getDailyStats(filter?: string, fromDate?: string, toDate?: string): Promise<{ sales: number; purchases: number; expenses: number; weeklySales: { date: string, amount: number }[] }> {
    let salesWhere = sql`1=1`;
    let purchasesWhere = sql`1=1`;
    let expensesWhere = sql`1=1`;

    // Build date filter conditions
    if (filter === "daily") {
      salesWhere = sql`${sales.date}::date = CURRENT_DATE`;
      purchasesWhere = sql`${purchases.date}::date = CURRENT_DATE`;
      expensesWhere = sql`${expenses.date}::date = CURRENT_DATE`;
    } else if (filter === "weekly") {
      salesWhere = sql`${sales.date}::date >= CURRENT_DATE - INTERVAL '7 days'`;
      purchasesWhere = sql`${purchases.date}::date >= CURRENT_DATE - INTERVAL '7 days'`;
      expensesWhere = sql`${expenses.date}::date >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (filter === "monthly") {
      salesWhere = sql`${sales.date}::date >= DATE_TRUNC('month', CURRENT_DATE)`;
      purchasesWhere = sql`${purchases.date}::date >= DATE_TRUNC('month', CURRENT_DATE)`;
      expensesWhere = sql`${expenses.date}::date >= DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (filter === "yearly") {
      salesWhere = sql`${sales.date}::date >= DATE_TRUNC('year', CURRENT_DATE)`;
      purchasesWhere = sql`${purchases.date}::date >= DATE_TRUNC('year', CURRENT_DATE)`;
      expensesWhere = sql`${expenses.date}::date >= DATE_TRUNC('year', CURRENT_DATE)`;
    } else if (filter === "custom" && fromDate && toDate) {
      salesWhere = sql`${sales.date}::date >= ${sql.raw(`'${fromDate}'`)}::date AND ${sales.date}::date <= ${sql.raw(`'${toDate}'`)}::date`;
      purchasesWhere = sql`${purchases.date}::date >= ${sql.raw(`'${fromDate}'`)}::date AND ${purchases.date}::date <= ${sql.raw(`'${toDate}'`)}::date`;
      expensesWhere = sql`${expenses.date}::date >= ${sql.raw(`'${fromDate}'`)}::date AND ${expenses.date}::date <= ${sql.raw(`'${toDate}'`)}::date`;
    }
    // "all" or undefined means no filter - show all data

    const [sResult] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
      .from(sales).where(salesWhere);
    const [pResult] = await db.select({ total: sql<number>`COALESCE(SUM(${purchases.totalAmount}), 0)` })
      .from(purchases).where(purchasesWhere);
    const [eResult] = await db.select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses).where(expensesWhere);

    // Generate chart data based on filter
    let weeklySales: { date: string, amount: number }[] = [];

    if (filter === "daily") {
      // Show hourly data for today
      for (let i = 0; i < 24; i++) {
        const [res] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
          .from(sales).where(sql`EXTRACT(HOUR FROM ${sales.date}) = ${i} AND ${sales.date}::date = CURRENT_DATE`);
        weeklySales.push({ date: `${i}:00`, amount: Number(res?.total || 0) });
      }
    } else if (filter === "weekly") {
      // Show last 7 days
      for (let i = 6; i >= 0; i--) {
        const [res] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
          .from(sales).where(sql`${sales.date}::date = CURRENT_DATE - INTERVAL '${sql.raw(String(i))} days'`);
        const date = new Date();
        date.setDate(date.getDate() - i);
        weeklySales.push({ date: date.toLocaleDateString('en-US', { weekday: 'short' }), amount: Number(res?.total || 0) });
      }
    } else if (filter === "monthly") {
      // Show last 30 days
      for (let i = 29; i >= 0; i--) {
        const [res] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
          .from(sales).where(sql`${sales.date}::date = CURRENT_DATE - INTERVAL '${sql.raw(String(i))} days'`);
        const date = new Date();
        date.setDate(date.getDate() - i);
        weeklySales.push({ date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), amount: Number(res?.total || 0) });
      }
    } else if (filter === "yearly") {
      // Show last 12 months
      for (let i = 11; i >= 0; i--) {
        const [res] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
          .from(sales).where(sql`${sales.date}::date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${sql.raw(String(i))} months') AND ${sales.date}::date < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${sql.raw(String(i - 1))} months')`);
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        weeklySales.push({ date: date.toLocaleDateString('en-US', { month: 'short' }), amount: Number(res?.total || 0) });
      }
    } else if (filter === "custom" && fromDate && toDate) {
      // Show daily data for custom range (max 90 days, otherwise monthly)
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 90) {
        // Daily data
        for (let i = 0; i <= daysDiff; i++) {
          const currentDate = new Date(from);
          currentDate.setDate(currentDate.getDate() + i);
          const dateStr = currentDate.toISOString().split('T')[0];
          const [res] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
            .from(sales).where(sql`${sales.date}::date = ${sql.raw(`'${dateStr}'`)}::date`);
          weeklySales.push({ date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), amount: Number(res?.total || 0) });
        }
      } else {
        // Monthly data
        const months = [];
        let current = new Date(from);
        while (current <= to) {
          months.push(new Date(current));
          current.setMonth(current.getMonth() + 1);
        }
        for (const month of months) {
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0];
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];
          const [res] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
            .from(sales).where(sql`${sales.date}::date >= ${sql.raw(`'${monthStart}'`)}::date AND ${sales.date}::date <= ${sql.raw(`'${monthEnd}'`)}::date`);
          weeklySales.push({ date: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), amount: Number(res?.total || 0) });
        }
      }
    } else {
      // Default: show last 7 days for "all"
      for (let i = 6; i >= 0; i--) {
        const [res] = await db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
          .from(sales).where(sql`${sales.date}::date = CURRENT_DATE - INTERVAL '${sql.raw(String(i))} days'`);
        const date = new Date();
        date.setDate(date.getDate() - i);
        weeklySales.push({ date: date.toLocaleDateString('en-US', { weekday: 'short' }), amount: Number(res?.total || 0) });
      }
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
