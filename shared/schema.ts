import { z } from "zod";

// === 1. ZOD SCHEMAS (API Validation) ===

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["admin", "staff"]).default("staff"),
  language: z.enum(["en", "ur", "roman"]).default("en"),
  isActive: z.boolean().default(true),
});

export const insertProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["Sabzi", "Phal", "Others"]).default("Sabzi"),
  purchaseRate: z.coerce.number().min(0).default(0),
  saleRate: z.coerce.number().min(0).default(0),
  unit: z.enum(["kg", "gram", "dozen"]).default("kg"),
  stock: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

export const insertClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  address: z.string().optional().default(""),
  company: z.string().optional().default(""),
  type: z.enum(["customer", "supplier", "both"]).default("both"),
  openingBalance: z.coerce.number().default(0),
  notes: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export const insertClientPaymentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  type: z.enum(["in", "out"]), // "in" = received from client, "out" = paid to client/supplier
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "bank", "online", "cheque", "other"]).default("cash"),
  reference: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  receivedBy: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  chequeNumber: z.string().optional().default(""),
  chequeDate: z.string().or(z.date()).optional().nullable(),
  receiptImage: z.string().optional().default(""),
  chequeImage: z.string().optional().default(""),
  date: z.string().or(z.date()).optional(),
});

export const insertPurchaseSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  clientId: z.string().optional().nullable(),
  supplier: z.string().optional(),
  quantity: z.coerce.number().gt(0, "Quantity must be greater than 0"),
  rate: z.coerce.number().min(0, "Rate must be 0 or more"),
  totalAmount: z.coerce.number().min(0),
});

export const insertSaleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().gt(0, "Quantity must be greater than 0"),
  rate: z.coerce.number().min(0, "Rate must be 0 or more"),
  amount: z.coerce.number().optional().default(0),
});

export const insertSaleSchema = z.object({
  clientId: z.string().optional().nullable(),
  items: z.array(insertSaleItemSchema).min(1, "At least one item is required"),
  totalAmount: z.coerce.number().min(0),
});

export const createSaleSchema = z.object({
  clientId: z.string().optional().nullable(),
  items: z.array(insertSaleItemSchema).min(1, "At least one item is required"),
});

export const insertExpenseSchema = z.object({
  userId: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  description: z.string().optional(),
});

// === 2. TYPES (Frontend and TypeScript) ===

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertClientPayment = z.infer<typeof insertClientPaymentSchema>;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type UserRole = "admin" | "staff";
export type UserLanguage = "en" | "ur" | "roman";
export type ProductCategory = "Sabzi" | "Phal" | "Others";
export type ProductUnit = "kg" | "gram" | "dozen";
export type ClientType = "customer" | "supplier" | "both";
export type PaymentMethod = "cash" | "bank" | "online" | "cheque" | "other";

export interface User {
  id: string;
  _id?: string;
  username: string;
  password?: string;
  role: UserRole;
  language: UserLanguage;
  isActive: boolean;
  createdAt: Date | string | null;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  category: ProductCategory;
  purchaseRate: number;
  saleRate: number;
  unit: ProductUnit;
  stock: number;
  isActive: boolean;
}

export interface Client {
  id: string;
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
  type: ClientType;
  openingBalance: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date | string;
  // Summary balances attached when querying
  totalSales?: number;
  totalPurchases?: number;
  totalReceived?: number;
  totalPaid?: number;
  netBalance?: number;
}

export interface ClientPayment {
  id: string;
  _id?: string;
  clientId: string;
  type: "in" | "out";
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  receivedBy?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: Date | string | null;
  receiptImage?: string;
  chequeImage?: string;
  date: Date | string;
  userId?: string | any;
  createdAt: Date | string;
}

export interface Purchase {
  id: string;
  _id?: string;
  productId: string | any;
  clientId?: string | any;
  supplier?: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  date: Date | string;
}

export interface SaleItem {
  id?: string;
  _id?: string;
  saleId?: string;
  productId: string | any;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Sale {
  id: string;
  _id?: string;
  userId?: string | any;
  clientId?: string | any;
  items?: SaleItem[];
  totalAmount: number;
  date: Date | string;
}

export interface Expense {
  id: string;
  _id?: string;
  userId?: string | any;
  category: string;
  amount: number;
  description?: string;
  date: Date | string;
}

export interface ClientSummary {
  client: Client;
  totalSales: number;
  totalPurchases: number;
  totalReceived: number;
  totalPaid: number;
  openingBalance: number;
  clearedAmount: number;
  netBalance: number;
  salesCount: number;
  purchasesCount: number;
  paymentsCount: number;
  sales: Sale[];
  purchases: Purchase[];
  payments: ClientPayment[];
  ledger: Array<{
    id: string;
    date: Date | string;
    type: "sale" | "purchase" | "payment_in" | "payment_out" | "opening_balance";
    description: string;
    debit: number; // money owed by client (e.g., sale)
    credit: number; // money cleared/paid by client or owed to client (e.g., payment in, purchase)
    runningBalance: number;
    reference?: string;
    details?: any;
  }>;
}