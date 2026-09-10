import {
  User, Product, Client, ClientPayment, Purchase, Sale, SaleItem, Expense
} from "./models";
import {
  type User as UserType,
  type Product as ProductType,
  type Client as ClientType,
  type ClientPayment as ClientPaymentType,
  type Purchase as PurchaseType,
  type Sale as SaleType,
  type SaleItem as SaleItemType,
  type Expense as ExpenseType,
  type ClientSummary
} from "@shared/schema";
import mongoose from "mongoose";

export interface IStorage {
  // User
  getUser(id: string): Promise<UserType | null>;
  getUserByUsername(username: string): Promise<UserType | null>;
  createUser(user: any): Promise<UserType>;
  getUsers(): Promise<UserType[]>;
  updateUser(id: string, updates: any): Promise<UserType | null>;
  deleteUser(id: string): Promise<void>;

  // Product
  getProducts(): Promise<ProductType[]>;
  getProduct(id: string): Promise<ProductType | null>;
  createProduct(product: any): Promise<ProductType>;
  updateProduct(id: string, updates: any): Promise<ProductType | null>;
  deleteProduct(id: string): Promise<void>;

  // Client
  getClients(): Promise<ClientType[]>;
  getClient(id: string): Promise<ClientType | null>;
  createClient(client: any): Promise<ClientType>;
  updateClient(id: string, updates: any): Promise<ClientType | null>;
  deleteClient(id: string): Promise<void>;
  getClientTransactions(clientId: string, filter?: string, fromDate?: string, toDate?: string): Promise<ClientSummary>;

  // Client Payment
  createClientPayment(payment: any): Promise<ClientPaymentType>;
  deleteClientPayment(id: string): Promise<void>;

  // Purchase
  createPurchase(purchase: any): Promise<PurchaseType>;
  updatePurchase(id: string, updates: any): Promise<PurchaseType | null>;
  deletePurchase(id: string): Promise<void>;
  getPurchases(): Promise<any[]>;

  // Sale
  createSale(userId: string, items: any[], clientId?: string | null): Promise<SaleType>;
  getSales(): Promise<any[]>;

  // Expense
  createExpense(expense: any): Promise<ExpenseType>;
  updateExpense(id: string, updates: any): Promise<ExpenseType | null>;
  deleteExpense(id: string): Promise<void>;
  getExpenses(userId?: string | null, isAdmin?: boolean): Promise<any[]>;

  // Stats
  getDailyStats(filter?: string, fromDate?: string, toDate?: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // === USER METHODS ===
  async getUser(id: string): Promise<UserType | null> {
    return await User.findById(id);
  }

  async getUserByUsername(username: string): Promise<UserType | null> {
    return await User.findOne({ username });
  }

  async createUser(user: any): Promise<UserType> {
    return await User.create(user);
  }

  async getUsers(): Promise<UserType[]> {
    return await User.find().sort({ createdAt: -1 });
  }

  async updateUser(id: string, updates: any): Promise<UserType | null> {
    return await User.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
  }

  async deleteUser(id: string): Promise<void> {
    await User.findByIdAndDelete(id);
  }

  // === PRODUCT METHODS ===
  async getProducts(): Promise<ProductType[]> {
    return await Product.find().sort({ name: 1 });
  }

  async getProduct(id: string): Promise<ProductType | null> {
    return await Product.findById(id);
  }

  async createProduct(product: any): Promise<ProductType> {
    return await Product.create(product);
  }

  async updateProduct(id: string, updates: any): Promise<ProductType | null> {
    return await Product.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
  }

  async deleteProduct(id: string): Promise<void> {
    await Product.findByIdAndDelete(id);
  }

  // === CLIENT METHODS ===
  async getClients(): Promise<ClientType[]> {
    const clients = await Client.find().sort({ name: 1 });

    // Calculate aggregated balances for all clients
    const clientList: ClientType[] = [];

    for (const c of clients) {
      const cIdStr = c._id.toString();
      const matchClientId = { $in: [c._id, cIdStr] };

      const salesSum = await Sale.aggregate([
        { $match: { clientId: matchClientId } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      const purchasesSum = await Purchase.aggregate([
        { $match: { clientId: matchClientId } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      const paymentsIn = await ClientPayment.aggregate([
        { $match: { clientId: matchClientId, type: "in" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const paymentsOut = await ClientPayment.aggregate([
        { $match: { clientId: matchClientId, type: "out" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const totalSales = salesSum[0]?.total || 0;
      const totalPurchases = purchasesSum[0]?.total || 0;
      const totalReceived = paymentsIn[0]?.total || 0;
      const totalPaid = paymentsOut[0]?.total || 0;
      const openingBalance = c.openingBalance || 0;

      // Net Balance: (Opening + Sales + Payments Out) - (Purchases + Payments In)
      // Positive = Client owes us (Receivable)
      // Negative = We owe client (Payable)
      const netBalance = (openingBalance + totalSales + totalPaid) - (totalPurchases + totalReceived);

      const clientObj = c.toJSON();
      clientObj.totalSales = totalSales;
      clientObj.totalPurchases = totalPurchases;
      clientObj.totalReceived = totalReceived;
      clientObj.totalPaid = totalPaid;
      clientObj.netBalance = netBalance;

      clientList.push(clientObj);
    }

    return clientList;
  }

  async getClient(id: string): Promise<ClientType | null> {
    return await Client.findById(id);
  }

  async createClient(client: any): Promise<ClientType> {
    return await Client.create(client);
  }

  async updateClient(id: string, updates: any): Promise<ClientType | null> {
    return await Client.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
  }

  async deleteClient(id: string): Promise<void> {
    await Client.findByIdAndDelete(id);
    // Also clean up client payments
    await ClientPayment.deleteMany({ clientId: id });
  }

  async getClientTransactions(
    clientId: string,
    filter = "all",
    fromDate?: string,
    toDate?: string
  ): Promise<ClientSummary> {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    // Build Date Filter Query
    let dateQuery: any = {};
    if (filter === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      dateQuery = { date: { $gte: start, $lte: end } };
    } else if (filter === "weekly") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      dateQuery = { date: { $gte: start } };
    } else if (filter === "monthly") {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      dateQuery = { date: { $gte: start } };
    } else if (filter === "yearly") {
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      dateQuery = { date: { $gte: start } };
    } else if (filter === "custom" && fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateQuery = { date: { $gte: start, $lte: end } };
    }

    const cIdStr = clientId.toString();
    const matchClientId = { $in: [clientObjectId, cIdStr] };

    // Fetch Sales linked to this Client
    const sales = await Sale.find({ clientId: matchClientId, ...dateQuery })
      .populate("userId", "username")
      .sort({ date: -1 });

    // For each sale, get its items
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await SaleItem.find({ saleId: sale._id }).populate("productId");
        const saleObj = sale.toJSON();
        saleObj.items = items;
        return saleObj;
      })
    );

    // Fetch Purchases linked to this Client (or matching supplier name)
    const purchaseQuery: any = {
      $or: [
        { clientId: matchClientId },
        { supplier: new RegExp(`^${client.name}$`, 'i') }
      ],
      ...dateQuery
    };
    const purchases = await Purchase.find(purchaseQuery)
      .populate("productId")
      .sort({ date: -1 });

    // Fetch Payments
    const payments = await ClientPayment.find({ clientId: matchClientId, ...dateQuery })
      .populate("userId", "username")
      .sort({ date: -1 });

    // Calculate Financial Totals
    const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalReceived = payments
      .filter((p) => p.type === "in")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaid = payments
      .filter((p) => p.type === "out")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const openingBalance = filter === "all" ? (client.openingBalance || 0) : 0;
    const clearedAmount = totalReceived + totalPaid;
    const netBalance = (openingBalance + totalSales + totalPaid) - (totalPurchases + totalReceived);

    // Build Unified Chronological Ledger
    const ledgerItems: Array<{
      id: string;
      date: Date | string;
      type: "sale" | "purchase" | "payment_in" | "payment_out" | "opening_balance";
      description: string;
      debit: number;
      credit: number;
      runningBalance: number;
      reference?: string;
      details?: any;
    }> = [];

    if (openingBalance !== 0) {
      ledgerItems.push({
        id: "opening",
        date: client.createdAt || new Date(),
        type: "opening_balance",
        description: "Opening Balance",
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        runningBalance: openingBalance,
        reference: "INITIAL",
      });
    }

    salesWithItems.forEach((s) => {
      ledgerItems.push({
        id: s.id || s._id?.toString(),
        date: s.date,
        type: "sale",
        description: `Sale Invoice #${(s.id || s._id?.toString()).slice(-6).toUpperCase()}`,
        debit: s.totalAmount, // client owes us
        credit: 0,
        runningBalance: 0, // computed below
        reference: `INV-${(s.id || s._id?.toString()).slice(-6).toUpperCase()}`,
        details: s,
      });
    });

    purchases.forEach((p) => {
      const prodName = (p.productId as any)?.name || "Stock Item";
      ledgerItems.push({
        id: p.id || p._id?.toString(),
        date: p.date,
        type: "purchase",
        description: `Purchase: ${prodName} (${p.quantity} x Rs. ${p.rate})`,
        debit: 0,
        credit: p.totalAmount, // we owe client
        runningBalance: 0, // computed below
        reference: `PO-${(p.id || p._id?.toString()).slice(-6).toUpperCase()}`,
        details: p,
      });
    });

    payments.forEach((pm) => {
      const isReceived = pm.type === "in";
      ledgerItems.push({
        id: pm.id || pm._id?.toString(),
        date: pm.date,
        type: isReceived ? "payment_in" : "payment_out",
        description: isReceived
          ? `Payment Received (${pm.paymentMethod.toUpperCase()}${pm.reference ? ` - Ref: ${pm.reference}` : ''})`
          : `Payment Given to Supplier (${pm.paymentMethod.toUpperCase()}${pm.reference ? ` - Ref: ${pm.reference}` : ''})`,
        debit: isReceived ? 0 : pm.amount,
        credit: isReceived ? pm.amount : 0,
        runningBalance: 0,
        reference: pm.reference || `PMT-${(pm.id || pm._id?.toString()).slice(-6).toUpperCase()}`,
        details: pm,
      });
    });

    // Sort ascending by date to compute chronological running balance
    ledgerItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let balance = 0;
    ledgerItems.forEach((item) => {
      balance += (item.debit - item.credit);
      item.runningBalance = balance;
    });

    // Sort descending by date for display
    ledgerItems.reverse();

    return {
      client: client.toJSON(),
      totalSales,
      totalPurchases,
      totalReceived,
      totalPaid,
      openingBalance,
      clearedAmount,
      netBalance,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      paymentsCount: payments.length,
      sales: salesWithItems,
      purchases: purchases.map((p) => p.toJSON()),
      payments: payments.map((p) => p.toJSON()),
      ledger: ledgerItems,
    };
  }

  // === CLIENT PAYMENT METHODS ===
  async createClientPayment(payment: any): Promise<ClientPaymentType> {
    return await ClientPayment.create(payment);
  }

  async deleteClientPayment(id: string): Promise<void> {
    await ClientPayment.findByIdAndDelete(id);
  }

  // === PURCHASE METHODS ===
  async createPurchase(purchaseData: any): Promise<PurchaseType> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const cleanData = { ...purchaseData };
      if (!cleanData.clientId || cleanData.clientId === "none" || cleanData.clientId === "") {
        delete cleanData.clientId;
      }
      cleanData.quantity = Number(cleanData.quantity);
      cleanData.rate = Number(cleanData.rate);
      cleanData.totalAmount = cleanData.totalAmount ? Number(cleanData.totalAmount) : cleanData.quantity * cleanData.rate;

      const purchase = await Purchase.create([cleanData], { session });
      await Product.findByIdAndUpdate(
        cleanData.productId,
        {
          $inc: { stock: cleanData.quantity },
          $set: { purchaseRate: cleanData.rate }
        },
        { session }
      );
      await session.commitTransaction();
      return purchase[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updatePurchase(id: string, updates: any): Promise<PurchaseType | null> {
    const existing = await Purchase.findById(id);
    if (!existing) return null;

    const oldQty = Number(existing.quantity) || 0;
    const newQty = updates.quantity !== undefined ? Number(updates.quantity) : oldQty;
    const qtyDiff = newQty - oldQty;

    const updated = await Purchase.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    if (updated && (qtyDiff !== 0 || updates.rate)) {
      await Product.findByIdAndUpdate(existing.productId, {
        $inc: { stock: qtyDiff },
        ...(updates.rate ? { $set: { purchaseRate: Number(updates.rate) } } : {})
      });
    }
    return updated;
  }

  async deletePurchase(id: string): Promise<void> {
    const purchase = await Purchase.findById(id);
    if (purchase) {
      await Product.findByIdAndUpdate(purchase.productId, {
        $inc: { stock: -purchase.quantity }
      });
      await Purchase.findByIdAndDelete(id);
    }
  }

  async getPurchases(): Promise<any[]> {
    return await Purchase.find()
      .populate("productId")
      .populate("clientId")
      .sort({ date: -1 });
  }

  // === SALE METHODS ===
  async createSale(userId: string, items: any[], clientId?: string | null): Promise<SaleType> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Strict Stock Validation: Verify available stock for all items before performing sale
      for (const item of items) {
        const prod = await Product.findById(item.productId).session(session);
        if (!prod) {
          throw new Error(`Product not found`);
        }
        const requestedQty = Number(item.quantity);
        if (prod.stock < requestedQty) {
          throw new Error(
            `Insufficient stock for "${prod.name}". Available: ${prod.stock} ${prod.unit}, Requested: ${requestedQty} ${prod.unit}`
          );
        }
      }

      let totalAmount = 0;
      items.forEach((item) => (totalAmount += Number(item.quantity) * Number(item.rate)));

      const saleData: any = {
        userId,
        totalAmount: Math.round(totalAmount),
      };
      if (clientId && clientId !== "walk-in" && clientId !== "none" && clientId !== "") {
        saleData.clientId = clientId;
      }

      const [newSale] = await Sale.create([saleData], { session });

      for (const item of items) {
        await SaleItem.create(
          [
            {
              saleId: newSale._id,
              productId: item.productId,
              quantity: Number(item.quantity),
              rate: Number(item.rate),
              amount: Math.round(Number(item.quantity) * Number(item.rate)),
            },
          ],
          { session }
        );

        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -Number(item.quantity) } },
          { session }
        );
      }

      await session.commitTransaction();
      return newSale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getSales(): Promise<any[]> {
    return await Sale.find()
      .populate("userId")
      .populate("clientId")
      .sort({ date: -1 });
  }

  // === EXPENSE METHODS ===
  async createExpense(expense: any): Promise<ExpenseType> {
    return await Expense.create(expense);
  }

  async updateExpense(id: string, updates: any): Promise<ExpenseType | null> {
    return await Expense.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
  }

  async deleteExpense(id: string): Promise<void> {
    await Expense.findByIdAndDelete(id);
  }

  async getExpenses(userId?: string | null, isAdmin?: boolean): Promise<any[]> {
    let query: any = {};
    if (!isAdmin && userId) {
      query.userId = userId;
    } else if (isAdmin && userId === null) {
      query.userId = null;
    } else if (isAdmin && userId) {
      query.userId = userId;
    }
    return await Expense.find(query).populate("userId").sort({ date: -1 });
  }

  // === STATS METHODS ===
  async getDailyStats(filter?: string, fromDate?: string, toDate?: string): Promise<any> {
    let start = new Date();
    start.setHours(0, 0, 0, 0);
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (filter === "weekly") {
      start.setDate(start.getDate() - 7);
    } else if (filter === "monthly") {
      start.setMonth(start.getMonth() - 1);
    } else if (filter === "yearly") {
      start.setFullYear(start.getFullYear() - 1);
    } else if (filter === "custom" && fromDate && toDate) {
      start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
    }

    const matchQuery = { date: { $gte: start, $lte: end } };

    const salesSum = await Sale.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const purchaseSum = await Purchase.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const expenseSum = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const weeklySalesData = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      sales: salesSum[0]?.total || 0,
      purchases: purchaseSum[0]?.total || 0,
      expenses: expenseSum[0]?.total || 0,
      weeklySales: weeklySalesData.map((d) => ({ date: d._id, amount: d.amount })),
    };
  }
}

export const storage = new DatabaseStorage();