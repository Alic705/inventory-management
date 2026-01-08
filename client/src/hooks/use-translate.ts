import { useI18n } from "@/lib/i18n";
import { getProductName, getCategoryName } from "@/lib/productNames";

type Language = 'en' | 'ur' | 'roman';

/**
 * Universal translation hook for the entire application
 * Handles any product name, category, or content translation
 * Future-proof: Just add new translations to productNames.ts
 */
export function useTranslate() {
  const { language } = useI18n();

  const translateProductName = (name: string): string => {
    if (!name) return name;
    return getProductName(name, language);
  };

  const translateCategory = (category: string): string => {
    if (!category) return category;
    return getCategoryName(category, language);
  };

  // Translate any custom text (for future extensibility)
  const translateCustom = (key: string, fallback: string): string => {
    // This can be extended to support custom translations
    return fallback;
  };

  // Helper to translate arrays of product names
  const translateProductNames = (names: string[]): string[] => {
    return names.map(name => translateProductName(name));
  };

  return {
    translateProductName,
    translateCategory,
    translateCustom,
    translateProductNames,
    currentLanguage: language,
  };
}
