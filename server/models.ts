import mongoose from "mongoose";

// === 1. MONGODB SCHEMAS (Database Structure) ===

const transformId = (_doc: any, ret: any) => {
  if (ret._id) {
    ret.id = ret._id.toString();
  }
  return ret;
};

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "staff"], default: "staff" },
  language: { type: String, enum: ["en", "ur", "roman"], default: "en" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
userSchema.set("toJSON", { transform: transformId });
userSchema.set("toObject", { transform: transformId });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ["Sabzi", "Phal", "Others"], required: true },
  purchaseRate: { type: Number, required: true },
  saleRate: { type: Number, required: true },
  unit: { type: String, enum: ["kg", "gram", "dozen"], default: "kg" },
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});
productSchema.set("toJSON", { transform: transformId });
productSchema.set("toObject", { transform: transformId });

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  address: { type: String, default: "" },
  company: { type: String, default: "" },
  type: { type: String, enum: ["customer", "supplier", "both"], default: "both" },
  openingBalance: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
clientSchema.set("toJSON", { transform: transformId });
clientSchema.set("toObject", { transform: transformId });

const clientPaymentSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  type: { type: String, enum: ["in", "out"], required: true }, // in = received from client, out = paid to client/supplier
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["cash", "bank", "online", "cheque", "other"], default: "cash" },
  reference: { type: String, default: "" },
  notes: { type: String, default: "" },
  receivedBy: { type: String, default: "" },
  bankName: { type: String, default: "" },
  chequeNumber: { type: String, default: "" },
  chequeDate: { type: Date },
  receiptImage: { type: String, default: "" },
  chequeImage: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});
clientPaymentSchema.set("toJSON", { transform: transformId });
clientPaymentSchema.set("toObject", { transform: transformId });

const purchaseSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  supplier: String,
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});
purchaseSchema.set("toJSON", { transform: transformId });
purchaseSchema.set("toObject", { transform: transformId });

const saleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  totalAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});
saleSchema.set("toJSON", { transform: transformId });
saleSchema.set("toObject", { transform: transformId });

const saleItemSchema = new mongoose.Schema({
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: "Sale", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});
saleItemSchema.set("toJSON", { transform: transformId });
saleItemSchema.set("toObject", { transform: transformId });

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: String,
  date: { type: Date, default: Date.now },
});
expenseSchema.set("toJSON", { transform: transformId });
expenseSchema.set("toObject", { transform: transformId });

// === 2. EXPORT MODELS ===

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);
export const ClientPayment = mongoose.models.ClientPayment || mongoose.model("ClientPayment", clientPaymentSchema);
export const Purchase = mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);
export const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema);
export const SaleItem = mongoose.models.SaleItem || mongoose.model("SaleItem", saleItemSchema);
export const Expense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

// Compatibility exports for existing routes
export {
  User as users,
  Product as products,
  Client as clients,
  ClientPayment as clientPayments,
  Purchase as purchases,
  Sale as sales,
  Expense as expenses
};
