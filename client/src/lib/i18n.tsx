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
    edit: "Edit"
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
    edit: "ترمیم"
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
    edit: "Edit"
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
  const [language, setLanguage] = useState<Language>('en');

  const value = {
    language,
    setLanguage,
    t: translations[language],
    dir: language === 'ur' ? 'rtl' : 'ltr'
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
