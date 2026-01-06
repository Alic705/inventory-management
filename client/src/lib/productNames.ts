// Centralized product names for all languages
// This file stores common vegetables and fruits names in all supported languages

type Language = 'en' | 'ur' | 'roman';

export interface ProductNameTranslations {
  en: string;
  ur: string;
  roman: string;
}

// Common vegetables (Sabzi) in market
export const vegetableNames: Record<string, ProductNameTranslations> = {
  'Tomato': { en: 'Tomato', ur: 'ٹماٹر', roman: 'Tamatar' },
  'Onion': { en: 'Onion', ur: 'پیاز', roman: 'Piyaz' },
  'Potato': { en: 'Potato', ur: 'آلو', roman: 'Aloo' },
  'Carrot': { en: 'Carrot', ur: 'گاجر', roman: 'Gajar' },
  'Cabbage': { en: 'Cabbage', ur: 'بند گوبھی', roman: 'Band Gobhi' },
  'Cauliflower': { en: 'Cauliflower', ur: 'پھول گوبھی', roman: 'Phool Gobhi' },
  'Spinach': { en: 'Spinach', ur: 'پالک', roman: 'Palak' },
  'Coriander': { en: 'Coriander', ur: 'دھنیا', roman: 'Dhaniya' },
  'Mint': { en: 'Mint', ur: 'پودینہ', roman: 'Pudina' },
  'Green Chili': { en: 'Green Chili', ur: 'ہری مرچ', roman: 'Hari Mirch' },
  'Red Chili': { en: 'Red Chili', ur: 'لال مرچ', roman: 'Lal Mirch' },
  'Ginger': { en: 'Ginger', ur: 'ادرک', roman: 'Adrak' },
  'Garlic': { en: 'Garlic', ur: 'لہسن', roman: 'Lehsun' },
  'Cucumber': { en: 'Cucumber', ur: 'کھیرا', roman: 'Kheera' },
  'Radish': { en: 'Radish', ur: 'مولی', roman: 'Mooli' },
  'Turnip': { en: 'Turnip', ur: 'شلغم', roman: 'Shalgam' },
  'Okra': { en: 'Okra', ur: 'بھنڈی', roman: 'Bhindi' },
  'Eggplant': { en: 'Eggplant', ur: 'بینگن', roman: 'Baingan' },
  'Bell Pepper': { en: 'Bell Pepper', ur: 'شملہ مرچ', roman: 'Shimla Mirch' },
  'Peas': { en: 'Peas', ur: 'مٹر', roman: 'Matar' },
  'Beans': { en: 'Beans', ur: 'پھلیاں', roman: 'Phaliyan' },
  'Lemon': { en: 'Lemon', ur: 'لیموں', roman: 'Lemon' },
  'Lime': { en: 'Lime', ur: 'نیبو', roman: 'Neebu' },
};

// Common fruits (Phal) in market
export const fruitNames: Record<string, ProductNameTranslations> = {
  'Apple': { en: 'Apple', ur: 'سیب', roman: 'Seb' },
  'Banana': { en: 'Banana', ur: 'کیلا', roman: 'Kela' },
  'Orange': { en: 'Orange', ur: 'سنگترہ', roman: 'Santra' },
  'Mango': { en: 'Mango', ur: 'آم', roman: 'Aam' },
  'Grapes': { en: 'Grapes', ur: 'انگور', roman: 'Angoor' },
  'Watermelon': { en: 'Watermelon', ur: 'تربوز', roman: 'Tarbuz' },
  'Melon': { en: 'Melon', ur: 'خربوزہ', roman: 'Kharbuza' },
  'Guava': { en: 'Guava', ur: 'امرود', roman: 'Amrood' },
  'Pomegranate': { en: 'Pomegranate', ur: 'انار', roman: 'Anar' },
  'Papaya': { en: 'Papaya', ur: 'پپیتا', roman: 'Papita' },
  'Pineapple': { en: 'Pineapple', ur: 'انناس', roman: 'Ananas' },
  'Strawberry': { en: 'Strawberry', ur: 'اسٹرابیری', roman: 'Strawberry' },
  'Peach': { en: 'Peach', ur: 'آڑو', roman: 'Aadu' },
  'Plum': { en: 'Plum', ur: 'آلو بخارا', roman: 'Aloo Bukhara' },
  'Pear': { en: 'Pear', ur: 'ناشپاتی', roman: 'Nashpati' },
  'Dates': { en: 'Dates', ur: 'کھجور', roman: 'Khajoor' },
  'Coconut': { en: 'Coconut', ur: 'ناریل', roman: 'Nariyal' },
};

// Category translations
export const categoryNames: Record<string, ProductNameTranslations> = {
  'Sabzi': { en: 'Vegetables', ur: 'سبزیاں', roman: 'Sabziyan' },
  'Phal': { en: 'Fruits', ur: 'پھل', roman: 'Phal' },
  'Others': { en: 'Others', ur: 'دیگر', roman: 'Dosray' },
};

// Get product name in specific language
export function getProductName(productName: string, language: Language): string {
  // Check in vegetables
  if (vegetableNames[productName]) {
    return vegetableNames[productName][language];
  }
  // Check in fruits
  if (fruitNames[productName]) {
    return fruitNames[productName][language];
  }
  // Check in categories
  if (categoryNames[productName]) {
    return categoryNames[productName][language];
  }
  // Return original if not found
  return productName;
}

// Get category name in specific language
export function getCategoryName(category: string, language: Language): string {
  return categoryNames[category]?.[language] || category;
}

// Get all product names for a category
export function getProductsByCategory(category: 'Sabzi' | 'Phal' | 'Others', language: Language): string[] {
  if (category === 'Sabzi') {
    return Object.keys(vegetableNames).map(name => vegetableNames[name][language]);
  } else if (category === 'Phal') {
    return Object.keys(fruitNames).map(name => fruitNames[name][language]);
  }
  return [];
}

