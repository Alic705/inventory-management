import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "staff"] }).notNull().default("staff"),
  language: text("language", { enum: ["en", "ur", "roman"] }).notNull().default("en"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { enum: ["Sabzi", "Phal", "Others"] }).notNull(),
  purchaseRate: integer("purchase_rate").notNull(), // stored in PKR
  saleRate: integer("sale_rate").notNull(),       // stored in PKR
  unit: text("unit", { enum: ["kg", "gram", "dozen"] }).notNull().default("kg"),
  stock: real("stock").notNull().default(0),      // stored in units (e.g. 1.5 kg)
  isActive: boolean("is_active").notNull().default(true),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  supplier: text("supplier"),
  quantity: real("quantity").notNull(),
  rate: integer("rate").notNull(), // Purchase rate at time of entry
  totalAmount: integer("total_amount").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Nullable if user deleted, but ideally FK
  totalAmount: integer("total_amount").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: real("quantity").notNull(),
  rate: integer("rate").notNull(), // Sale rate at time of sale
  amount: integer("amount").notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // Rent, Electricity, Salary, etc.
  amount: integer("amount").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow().notNull(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
}));

export const productsRelations = relations(products, ({ many }) => ({
  purchases: many(purchases),
  saleItems: many(saleItems),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  product: one(products, {
    fields: [purchases.productId],
    references: [products.id],
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, date: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, date: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, date: true });

// === TYPES ===

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
