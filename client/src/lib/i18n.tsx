import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ur' | 'roman';

interface Translations {
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
  // Load language from localStorage or default to 'en'
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
