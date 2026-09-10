import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ur' | 'roman';

export interface Translations {
  dashboard: string;
  pos: string;
  products: string;
  purchases: string;
  expenses: string;
  users: string;
  reports: string;
  settings: string;
  logout: string;
  totalSales: string;
  totalPurchases: string;
  netProfit: string;
  welcome: string;
  addToCart: string;
  checkout: string;
  clear: string;
  item: string;
  qty: string;
  price: string;
  total: string;
  search: string;
  add: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  // Login
  signIn: string;
  username: string;
  password: string;
  enterUsername: string;
  enterPassword: string;
  // Dashboard
  weeklyOverview: string;
  // Purchases
  newPurchase: string;
  addPurchaseStock: string;
  selectProduct: string;
  supplier: string;
  quantity: string;
  rate: string;
  cost: string;
  totalAmount: string;
  savePurchase: string;
  recordNewStock: string;
  date: string;
  product: string;
  // Expenses
  addExpense: string;
  category: string;
  description: string;
  amount: string;
  saveExpense: string;
  trackDailyCosts: string;
  // POS
  currentBill: string;
  cartEmpty: string;
  subtotal: string;
  discount: string;
  applyDiscount: string;
  // Products
  manageInventory: string;
  addNewProduct: string;
  editProduct: string;
  name: string;
  unit: string;
  purchaseRate: string;
  saleRate: string;
  initialStock: string;
  stock: string;
  actions: string;
  noProductsFound: string;
  // Users
  userManagement: string;
  controlAccess: string;
  createNewUser: string;
  createUser: string;
  role: string;
  status: string;
  active: string;
  inactive: string;
  createdAt: string;
  // Reports
  downloadReport: string;
  // Common
  loading: string;
  unknown: string;
  unknownProduct: string;
  unknownUnit: string;
  // Date filters
  daily: string;
  weekly: string;
  monthly: string;
  custom: string;
  selectDateRange: string;
  from: string;
  to: string;
  // Additional translations
  user: string;
  admin: string;
  staff: string;
  allExpenses: string;
  adminOnly: string;
  allStaff: string;
  filterByUser: string;
  noExpensesFound: string;
  noUsersFound: string;
  confirmDelete: string;
  leaveBlankToKeep: string;
  yearly: string;
  allTime: string;
  salesOverview: string;
  dailyOverview: string;
  weeklyOverviewTitle: string;
  monthlyOverview: string;
  yearlyOverview: string;
  customOverview: string;
  all: string;
  // Client Management Module
  clients: string;
  clientManagement: string;
  clientList: string;
  clientDetails: string;
  addClient: string;
  editClient: string;
  clientName: string;
  clientType: string;
  customer: string;
  supplierType: string;
  bothType: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  openingBalance: string;
  notes: string;
  netBalance: string;
  clearedAmount: string;
  recordPayment: string;
  paymentType: string;
  paymentIn: string;
  paymentOut: string;
  paymentMethod: string;
  cash: string;
  bank: string;
  online: string;
  cheque: string;
  reference: string;
  ledger: string;
  allTransactions: string;
  salesHistory: string;
  purchasesHistory: string;
  paymentsHistory: string;
  receivable: string;
  payable: string;
  settled: string;
  debit: string;
  credit: string;
  runningBalance: string;
  noClientsFound: string;
  noTransactionsFound: string;
  selectClient: string;
  walkInCustomer: string;
  // Login & Brand
  inventoryManagement: string;
  enterCredentials: string;
  marketManager: string;
  // Dashboard & Khata
  viewParties: string;
  customerKhataSub: string;
  supplierKhataSub: string;
  customerKhataLabel: string;
  supplierKhataLabel: string;
  // Reports
  financialOverviewTab: string;
  partyLedgersTab: string;
  expensesBreakdownTab: string;
  stockPurchasesTab: string;
  incomeStatementTitle: string;
  periodLabel: string;
  grossSalesRevenue: string;
  lessStockPurchases: string;
  lessOperatingCosts: string;
  netOperatingProfit: string;
  profitMarginLabel: string;
  expenseToSalesLabel: string;
  salesRevenueActivityTitle: string;
  exportCSV: string;
  printLabel: string;
  reportsSubtext: string;
  totalSalesSubtext: string;
  stockPurchaseCostSubtext: string;
  operatingExpensesSubtext: string;
  netPositiveProfitSubtext: string;
  operatingLossSubtext: string;
  fromCustomersSubtext: string;
  toSuppliersSubtext: string;
  categoryBreakdown: string;
  receivedIn: string;
  paidOut: string;
  noSalesRecorded: string;
  noExpensesRecorded: string;
  noPurchasesFound: string;
}

const translations: Record<Language, Translations> = {
  en: {
    dashboard: "Dashboard",
    pos: "Point of Sale",
    products: "Products",
    purchases: "Purchases",
    expenses: "Expenses",
    users: "Users",
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    totalSales: "Total Sales",
    totalPurchases: "Total Purchases",
    netProfit: "Net Profit",
    welcome: "Welcome back",
    addToCart: "Add",
    checkout: "Checkout",
    clear: "Clear",
    item: "Item",
    qty: "Qty",
    price: "Price",
    total: "Total",
    search: "Search...",
    add: "Add New",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    signIn: "Sign In",
    username: "Username",
    password: "Password",
    enterUsername: "Enter username",
    enterPassword: "Enter password",
    weeklyOverview: "Weekly Overview",
    newPurchase: "New Purchase",
    addPurchaseStock: "Add Purchase Stock",
    selectProduct: "Select product",
    supplier: "Supplier",
    quantity: "Quantity",
    rate: "Rate",
    cost: "Cost",
    totalAmount: "Total Amount",
    savePurchase: "Save Purchase",
    recordNewStock: "Record new stock arrivals.",
    date: "Date",
    product: "Product",
    addExpense: "Add Expense",
    category: "Category",
    description: "Description",
    amount: "Amount",
    saveExpense: "Save Expense",
    trackDailyCosts: "Track daily operating costs.",
    currentBill: "Current Bill",
    cartEmpty: "Cart is empty",
    subtotal: "Subtotal",
    discount: "Discount",
    applyDiscount: "Apply Discount",
    manageInventory: "Manage your inventory and pricing.",
    addNewProduct: "Add New Product",
    editProduct: "Edit Product",
    name: "Name",
    unit: "Unit",
    purchaseRate: "Purchase Rate",
    saleRate: "Sale Rate",
    initialStock: "Initial Stock",
    stock: "Stock",
    actions: "Actions",
    noProductsFound: "No products found",
    userManagement: "User Management",
    controlAccess: "Control access and roles for staff.",
    createNewUser: "Create New User",
    createUser: "Create User",
    role: "Role",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    createdAt: "Created At",
    downloadReport: "Download Report",
    loading: "Loading...",
    unknown: "Unknown",
    unknownProduct: "Unknown Product",
    unknownUnit: "Unknown Unit",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    custom: "Custom",
    selectDateRange: "Select Date Range",
    from: "From",
    to: "To",
    user: "User",
    admin: "Admin",
    staff: "Staff",
    allExpenses: "All Expenses",
    adminOnly: "Admin Only",
    allStaff: "All Staff",
    filterByUser: "Filter by user",
    noExpensesFound: "No expenses found",
    noUsersFound: "No users found",
    confirmDelete: "Are you sure you want to delete this?",
    leaveBlankToKeep: "(leave blank to keep current)",
    yearly: "Yearly",
    allTime: "All Time",
    salesOverview: "Sales Overview",
    dailyOverview: "Daily Overview",
    weeklyOverviewTitle: "Weekly Overview",
    monthlyOverview: "Monthly Overview",
    yearlyOverview: "Yearly Overview",
    customOverview: "Custom Range Overview",
    all: "All",
    // Clients
    clients: "Clients / Parties",
    clientManagement: "Client Management",
    clientList: "Manage your customers, suppliers & ledgers.",
    clientDetails: "Client Details & Ledger",
    addClient: "Add New Client",
    editClient: "Edit Client",
    clientName: "Client / Party Name",
    clientType: "Party Type",
    customer: "Customer (Buyer)",
    supplierType: "Supplier (Vendor)",
    bothType: "Both (Customer & Supplier)",
    company: "Company / Shop Name",
    phone: "Phone Number",
    email: "Email Address",
    address: "Address",
    openingBalance: "Opening Balance",
    notes: "Notes",
    netBalance: "Pending Balance",
    clearedAmount: "Total Cleared / Paid",
    recordPayment: "Record Payment / Clear",
    paymentType: "Payment Type",
    paymentIn: "Payment Received (Cash In)",
    paymentOut: "Payment Given (Cash Out)",
    paymentMethod: "Payment Method",
    cash: "Cash",
    bank: "Bank Transfer",
    online: "Online / Mobile Wallet",
    cheque: "Cheque",
    reference: "Reference / Slip #",
    ledger: "Ledger",
    allTransactions: "All Transactions",
    salesHistory: "Sales Invoices",
    purchasesHistory: "Purchases",
    paymentsHistory: "Payment Receipts",
    receivable: "Receivable",
    payable: "Payable",
    settled: "Settled",
    debit: "Debit (+)",
    credit: "Credit (-)",
    runningBalance: "Running Balance",
    noClientsFound: "No clients found",
    noTransactionsFound: "No transactions found for this period",
    selectClient: "Select Client (Optional)",
    walkInCustomer: "Walk-in Customer (General)",
    // Login & Brand
    inventoryManagement: "Inventory & Sales Management Software",
    enterCredentials: "Enter your credentials to access the market management system.",
    marketManager: "Market Manager",
    // Dashboard & Khata
    viewParties: "View Parties",
    customerKhataSub: "Total pending collection from customers",
    supplierKhataSub: "Total pending payment to suppliers",
    customerKhataLabel: "(Customer Khata)",
    supplierKhataLabel: "(Supplier Khata)",
    // Reports
    financialOverviewTab: "Financial Overview",
    partyLedgersTab: "Party Ledgers",
    expensesBreakdownTab: "Expenses Breakdown",
    stockPurchasesTab: "Stock Purchases",
    incomeStatementTitle: "Income Statement (P&L)",
    periodLabel: "Period",
    grossSalesRevenue: "Gross Sales Revenue:",
    lessStockPurchases: "Less Stock Purchases:",
    lessOperatingCosts: "Less Operating Costs:",
    netOperatingProfit: "Net Operating Profit:",
    profitMarginLabel: "Profit Margin:",
    expenseToSalesLabel: "Expense to Sales:",
    salesRevenueActivityTitle: "Sales Revenue Activity",
    exportCSV: "Export CSV",
    printLabel: "Print",
    reportsSubtext: "Complete financial overview, sales, purchases, expenses & ledger reports.",
    totalSalesSubtext: "Total sales revenue",
    stockPurchaseCostSubtext: "Stock purchase cost",
    operatingExpensesSubtext: "Operating expenses",
    netPositiveProfitSubtext: "Net positive profit",
    operatingLossSubtext: "Operating loss",
    fromCustomersSubtext: "From customers",
    toSuppliersSubtext: "To suppliers",
    categoryBreakdown: "Category Breakdown",
    receivedIn: "Received (In)",
    paidOut: "Paid (Out)",
    noSalesRecorded: "No sales recorded for this period.",
    noExpensesRecorded: "No expenses recorded.",
    noPurchasesFound: "No purchases found.",
  },
  ur: {
    dashboard: "ڈیش بورڈ",
    pos: "فروخت",
    products: "مصنوعات",
    purchases: "خریداری",
    expenses: "اخراجات",
    users: "صارفین",
    reports: "رپورٹس",
    settings: "ترتیبات",
    logout: "لاگ آؤٹ",
    totalSales: "کل فروخت",
    totalPurchases: "کل خریداری",
    netProfit: "خالص منافع",
    welcome: "خوش آمدید",
    addToCart: "شامل کریں",
    checkout: "چیک آؤٹ",
    clear: "صاف کریں",
    item: "آئٹم",
    qty: "مقدار",
    price: "قیمت",
    total: "کل",
    search: "تلاش کریں...",
    add: "نیا شامل کریں",
    save: "محفوظ کریں",
    cancel: "منسوخ کریں",
    delete: "حذف کریں",
    edit: "ترمیم",
    signIn: "لاگ ان",
    username: "صارف نام",
    password: "پاس ورڈ",
    enterUsername: "صارف نام درج کریں",
    enterPassword: "پاس ورڈ درج کریں",
    weeklyOverview: "ہفتہ وار جائزہ",
    newPurchase: "نیا خرید",
    addPurchaseStock: "خریداری کا سامان شامل کریں",
    selectProduct: "مصنوعات منتخب کریں",
    supplier: "سپلائر",
    quantity: "مقدار",
    rate: "نرخ",
    cost: "لاگت",
    totalAmount: "کل رقم",
    savePurchase: "خریداری محفوظ کریں",
    recordNewStock: "نئے سامان کی آمد درج کریں۔",
    date: "تاریخ",
    product: "مصنوعات",
    addExpense: "خرچہ شامل کریں",
    category: "قسم",
    description: "تفصیل",
    amount: "رقم",
    saveExpense: "خرچہ محفوظ کریں",
    trackDailyCosts: "روزانہ آپریٹنگ اخراجات کو ٹریک کریں۔",
    currentBill: "موجودہ بل",
    cartEmpty: "کارٹ خالی ہے",
    subtotal: "ذیلی کل",
    discount: "رعایت",
    applyDiscount: "رعایت لاگو کریں",
    manageInventory: "اپنے انوینٹری اور قیمتوں کا انتظام کریں۔",
    addNewProduct: "نیا مصنوعات شامل کریں",
    editProduct: "مصنوعات میں ترمیم کریں",
    name: "نام",
    unit: "اکائی",
    purchaseRate: "خریداری کی قیمت",
    saleRate: "فروخت کی قیمت",
    initialStock: "ابتدائی اسٹاک",
    stock: "اسٹاک",
    actions: "اعمال",
    noProductsFound: "کوئی مصنوعات نہیں ملی",
    userManagement: "صارفین کا انتظام",
    controlAccess: "عملے کے لیے رسائی اور کردار کو کنٹرول کریں۔",
    createNewUser: "نیا صارف بنائیں",
    createUser: "صارف بنائیں",
    role: "کردار",
    status: "حالت",
    active: "فعال",
    inactive: "غیر فعال",
    createdAt: "تاریخ تخلیق",
    downloadReport: "رپورٹ ڈاؤن لوڈ کریں",
    loading: "لوڈ ہو رہا ہے...",
    unknown: "نامعلوم",
    unknownProduct: "نامعلوم مصنوعات",
    unknownUnit: "نامعلوم اکائی",
    daily: "روزانہ",
    weekly: "ہفتہ وار",
    monthly: "ماہانہ",
    custom: "حسب ضرورت",
    selectDateRange: "تاریخ کی حد منتخب کریں",
    from: "سے",
    to: "تک",
    user: "صارف",
    admin: "ایڈمن",
    staff: "عملہ",
    allExpenses: "تمام اخراجات",
    adminOnly: "صرف ایڈمن",
    allStaff: "تمام عملہ",
    filterByUser: "صارف کے لحاظ سے فلٹر کریں",
    noExpensesFound: "کوئی اخراجات نہیں ملے",
    noUsersFound: "کوئی صارفین نہیں ملے",
    confirmDelete: "کیا آپ واقعی اسے حذف کرنا چاہتے ہیں؟",
    leaveBlankToKeep: "(موجودہ رکھنے کے لیے خالی چھوڑیں)",
    yearly: "سالانہ",
    allTime: "تمام وقت",
    salesOverview: "فروخت کا جائزہ",
    dailyOverview: "روزانہ جائزہ",
    weeklyOverviewTitle: "ہفتہ وار جائزہ",
    monthlyOverview: "ماہانہ جائزہ",
    yearlyOverview: "سالانہ جائزہ",
    customOverview: "حسب ضرورت جائزہ",
    all: "سب",
    // Clients
    clients: "گاہک اور سپلائر",
    clientManagement: "کلائنٹس کا انتظام",
    clientList: "اپنے گاہکوں، سپلائرز اور کھاتوں کا انتظام کریں۔",
    clientDetails: "کلائنٹ کی تفصیل اور کھاتہ",
    addClient: "نیا کلائنٹ شامل کریں",
    editClient: "کلائنٹ میں ترمیم کریں",
    clientName: "کلائنٹ / پارٹی کا نام",
    clientType: "پارٹی کی قسم",
    customer: "گاہک (خریدار)",
    supplierType: "سپلائر (فروخت کنندہ)",
    bothType: "دونوں (گاہک اور سپلائر)",
    company: "کمپنی / دکان کا نام",
    phone: "فون نمبر",
    email: "ای میل ایڈریس",
    address: "پتہ",
    openingBalance: "ابتدائی بقایا",
    notes: "نوٹس",
    netBalance: "بقایا رقم",
    clearedAmount: "کل ادا شدہ / کلیئر رقم",
    recordPayment: "ادائیگی درج / کلیئر کریں",
    paymentType: "ادائیگی کی قسم",
    paymentIn: "رقم وصول ہوئی (کیش ان)",
    paymentOut: "رقم ادا کی (کیش آؤٹ)",
    paymentMethod: "ادائیگی کا طریقہ",
    cash: "نقد",
    bank: "بینک ٹرانسفر",
    online: "آن لائن / موبائل والیٹ",
    cheque: "چیک",
    reference: "حوالہ نمبر / سلپ",
    ledger: "کھاتہ",
    allTransactions: "تمام لین دین",
    salesHistory: "فروخت کے انوائس",
    purchasesHistory: "خریداری",
    paymentsHistory: "ادائیگیوں کی رسیدیں",
    receivable: "قابل وصول",
    payable: "قابل ادا",
    settled: "بے باق",
    debit: "ڈیبٹ (+)",
    credit: "کریڈٹ (-)",
    runningBalance: "موجودہ بقایا",
    noClientsFound: "کوئی کلائنٹ نہیں ملا",
    noTransactionsFound: "اس مدت کے لیے کوئی لین دین نہیں ملا",
    selectClient: "کلائنٹ منتخب کریں (اختیاری)",
    walkInCustomer: "عام گاہک (جنرل)",
    // Login & Brand
    inventoryManagement: "انوینٹری اور سیلز مینجمنٹ سافٹ ویئر",
    enterCredentials: "مارکیٹ مینجمنٹ سسٹم میں داخل ہونے کے لیے اپنا صارف نام اور پاس ورڈ درج کریں۔",
    marketManager: "مارکیٹ مینیجر",
    // Dashboard & Khata
    viewParties: "پارٹیاں دیکھیں",
    customerKhataSub: "گاہکوں سے کل وصول طلب بقایا",
    supplierKhataSub: "سپلائرز کو کل واجب الادا بقایا",
    customerKhataLabel: "(گاہک کھاتہ)",
    supplierKhataLabel: "(سپلائر کھاتہ)",
    // Reports
    financialOverviewTab: "مالیاتی جائزہ",
    partyLedgersTab: "پارٹی لیجرز",
    expensesBreakdownTab: "اخراجات کی تفصیل",
    stockPurchasesTab: "اسٹاک خریداری",
    incomeStatementTitle: "آمدنی اور نفع و نقصان (P&L)",
    periodLabel: "مدت",
    grossSalesRevenue: "کل فروخت آمدنی:",
    lessStockPurchases: "منہا اسٹاک خریداری:",
    lessOperatingCosts: "منہا کاروباری اخراجات:",
    netOperatingProfit: "خالص کاروباری منافع:",
    profitMarginLabel: "منافع مارجن:",
    expenseToSalesLabel: "خرچہ بمقابلہ فروخت:",
    salesRevenueActivityTitle: "فروخت کی سرگرمی",
    exportCSV: "سی ایس وی ایکسپورٹ",
    printLabel: "پرنٹ کریں",
    reportsSubtext: "مالیاتی رپورٹس، فروخت، خریداری، اخراجات اور کھاتوں کا مکمل تجزیہ۔",
    totalSalesSubtext: "کل فروخت کی رقم",
    stockPurchaseCostSubtext: "اسٹاک خریداری لاگت",
    operatingExpensesSubtext: "روزمرہ اخراجات",
    netPositiveProfitSubtext: "خالص منافع",
    operatingLossSubtext: "خسارہ",
    fromCustomersSubtext: "گاہکوں سے وصول طلب",
    toSuppliersSubtext: "سپلائرز کو واجب الادا",
    categoryBreakdown: "اقسام کی تفصیل",
    receivedIn: "وصول شدہ (کیش ان)",
    paidOut: "ادا شدہ (کیش آؤٹ)",
    noSalesRecorded: "اس مدت میں کوئی فروخت درج نہیں ہے۔",
    noExpensesRecorded: "کوئی اخراجات درج نہیں ہیں۔",
    noPurchasesFound: "کوئی خریداری نہیں ملی۔",
  },
  roman: {
    dashboard: "Dashboard",
    pos: "Dukaan (POS)",
    products: "Maal (Products)",
    purchases: "Khareedari",
    expenses: "Kharchay",
    users: "Staff",
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    totalSales: "Kul Farokht",
    totalPurchases: "Kul Khareed",
    netProfit: "Munafa",
    welcome: "Khush Amdeed",
    addToCart: "Daalo",
    checkout: "Bill Banao",
    clear: "Saaf Karo",
    item: "Cheez",
    qty: "Wazan/Tadad",
    price: "Daam",
    total: "Jor",
    search: "Dhoondo...",
    add: "Naya Daalo",
    save: "Save Karo",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    signIn: "Sign In",
    username: "Username",
    password: "Password",
    enterUsername: "Username daalo",
    enterPassword: "Password daalo",
    weeklyOverview: "Hafta War Jaaiza",
    newPurchase: "Naya Khareed",
    addPurchaseStock: "Khareedari Ka Samaan Daalo",
    selectProduct: "Maal chuno",
    supplier: "Supplier",
    quantity: "Miqdar",
    rate: "Narkh",
    cost: "Laagat",
    totalAmount: "Kul Raqam",
    savePurchase: "Khareedari Save Karo",
    recordNewStock: "Naye samaan ki aamad darj karo.",
    date: "Tareekh",
    product: "Maal",
    addExpense: "Kharcha Daalo",
    category: "Qism",
    description: "Tafseel",
    amount: "Raqam",
    saveExpense: "Kharcha Save Karo",
    trackDailyCosts: "Rozana operating costs ko track karo.",
    currentBill: "Mojooda Bill",
    cartEmpty: "Cart khali hai",
    subtotal: "Zeli Kul",
    discount: "Raiyat",
    applyDiscount: "Raiyat Lagao",
    manageInventory: "Apne inventory aur qeematon ka intizam karo.",
    addNewProduct: "Naya Maal Daalo",
    editProduct: "Maal Mein Tarmeem Karo",
    name: "Naam",
    unit: "Ikai",
    purchaseRate: "Khareedari Ki Qeemat",
    saleRate: "Farokht Ki Qeemat",
    initialStock: "Ibtidai Stock",
    stock: "Stock",
    actions: "Amaal",
    noProductsFound: "Koi maal nahi mila",
    userManagement: "Users Ka Intizam",
    controlAccess: "Amle ke liye rasai aur role ko control karo.",
    createNewUser: "Naya User Banao",
    createUser: "User Banao",
    role: "Role",
    status: "Haalat",
    active: "Faal",
    inactive: "Ghair Faal",
    createdAt: "Tareekh Takhleeq",
    downloadReport: "Report Download Karo",
    loading: "Load ho raha hai...",
    unknown: "Na Maloom",
    unknownProduct: "Na Maloom Maal",
    unknownUnit: "Na Maloom Ikai",
    daily: "Rozana",
    weekly: "Hafta War",
    monthly: "Mahana",
    custom: "Hasb Zaroorat",
    selectDateRange: "Tareekh Ki Had Chuno",
    from: "Se",
    to: "Tak",
    user: "User",
    admin: "Admin",
    staff: "Staff",
    allExpenses: "Sab Kharchay",
    adminOnly: "Sirf Admin",
    allStaff: "Sab Staff",
    filterByUser: "User ke hisab se filter karo",
    noExpensesFound: "Koi kharchay nahi mile",
    noUsersFound: "Koi users nahi mile",
    confirmDelete: "Kya aap waqai ise delete karna chahte hain?",
    leaveBlankToKeep: "(mojooda rakhne ke liye khali chhodo)",
    yearly: "Salana",
    allTime: "Sab Waqt",
    salesOverview: "Farokht Ka Jaaiza",
    dailyOverview: "Rozana Jaaiza",
    weeklyOverviewTitle: "Hafta War Jaaiza",
    monthlyOverview: "Mahana Jaaiza",
    yearlyOverview: "Salana Jaaiza",
    customOverview: "Hasb Zaroorat Jaaiza",
    all: "Sab",
    // Clients
    clients: "Clients / Parties",
    clientManagement: "Clients Ka Intizam",
    clientList: "Gahakon, suppliers aur khaton ka intizam karein.",
    clientDetails: "Client Ki Tafseel aur Khata",
    addClient: "Naya Client Daalo",
    editClient: "Client Edit Karo",
    clientName: "Client / Party Ka Naam",
    clientType: "Party Ki Qism",
    customer: "Gahak (Customer)",
    supplierType: "Supplier (Vendor)",
    bothType: "Dono (Gahak aur Supplier)",
    company: "Company / Dukaan Ka Naam",
    phone: "Phone Number",
    email: "Email Address",
    address: "Pata / Address",
    openingBalance: "Pichla Baqaya (Opening)",
    notes: "Notes",
    netBalance: "Baqaya Raqam",
    clearedAmount: "Kul Ada Shuda / Clear",
    recordPayment: "Payment Darj / Clear Karo",
    paymentType: "Payment Ki Qism",
    paymentIn: "Raqam Vasool Hui (Cash In)",
    paymentOut: "Raqam Ada Ki (Cash Out)",
    paymentMethod: "Payment Ka Tareeqa",
    cash: "Naqad (Cash)",
    bank: "Bank Transfer",
    online: "Online / Mobile Wallet",
    cheque: "Cheque",
    reference: "Reference / Slip #",
    ledger: "Khata (Ledger)",
    allTransactions: "Sabhi Transactions",
    salesHistory: "Farokht Ke Bills",
    purchasesHistory: "Khareedari",
    paymentsHistory: "Payment Receipts",
    receivable: "Vasool Talab",
    payable: "Wajib ul Ada",
    settled: "Clear / Nil",
    debit: "Debit (+)",
    credit: "Credit (-)",
    runningBalance: "Baqaya (Balance)",
    noClientsFound: "Koi client nahi mila",
    noTransactionsFound: "Is muddat ka koi transaction nahi mila",
    selectClient: "Client Chuno (Ikhtiyari)",
    walkInCustomer: "Aam Gahak (General)",
    // Login & Brand
    inventoryManagement: "Inventory aur Sales Management Software",
    enterCredentials: "Market management system mein login karne ke liye apna username aur password daalein.",
    marketManager: "Market Manager",
    // Dashboard & Khata
    viewParties: "Parties Dekhein",
    customerKhataSub: "Gahakon se kul vasool talab baqaya",
    supplierKhataSub: "Suppliers ko kul wajib ul ada baqaya",
    customerKhataLabel: "(Gahak Khata)",
    supplierKhataLabel: "(Supplier Khata)",
    // Reports
    financialOverviewTab: "Maaliat Ka Jaiza",
    partyLedgersTab: "Party Ledgers",
    expensesBreakdownTab: "Kharchon Ki Tafseel",
    stockPurchasesTab: "Stock Khareedari",
    incomeStatementTitle: "Aamdani aur Munafa/Nuqsan (P&L)",
    periodLabel: "Muddat",
    grossSalesRevenue: "Kul Sale Aamdani:",
    lessStockPurchases: "Manha Stock Khareedari:",
    lessOperatingCosts: "Manha Karobari Kharchay:",
    netOperatingProfit: "Khaalis Karobari Munafa:",
    profitMarginLabel: "Munafa Margin:",
    expenseToSalesLabel: "Kharcha Ba-Muqabla Sale:",
    salesRevenueActivityTitle: "Sale Aamdani Ki Soort-e-Haal",
    exportCSV: "CSV Export",
    printLabel: "Print Karein",
    reportsSubtext: "Maaliat, sale, khareedari, kharchon aur khaton ka mukammal jaiza.",
    totalSalesSubtext: "Kul sale ki aamdani",
    stockPurchaseCostSubtext: "Stock khareedari ki laagat",
    operatingExpensesSubtext: "Rozmarrah karobari kharchay",
    netPositiveProfitSubtext: "Khaalis munafa",
    operatingLossSubtext: "Karobari nuqsan",
    fromCustomersSubtext: "Gahakon se vasool talab",
    toSuppliersSubtext: "Suppliers ko wajib ul ada",
    categoryBreakdown: "Aqsam Ki Tafseel",
    receivedIn: "Vasool Shuda (In)",
    paidOut: "Ada Shuda (Out)",
    noSalesRecorded: "Is muddat mein koi sale darj nahi hai.",
    noExpensesRecorded: "Koi kharchay darj nahi hain.",
    noPurchasesFound: "Koi khareedari nahi mili.",
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-language') as Language | null;
      return saved && ['en', 'ur', 'roman'].includes(saved) ? saved : 'en';
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', lang);
    }
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
    dir: (language === 'ur' ? 'rtl' : 'ltr') as 'rtl' | 'ltr'
  };

  return (
    <I18nContext.Provider value={value}>
      <div dir={value.dir} className={value.dir === 'rtl' ? 'font-urdu' : ''}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within an I18nProvider");
  return context;
}
