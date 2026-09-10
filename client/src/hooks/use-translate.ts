import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { getProductName, getCategoryName } from "@/lib/productNames";
import { fetchLiveTranslation, getCachedTranslationSync } from "@/lib/translator";

type Language = 'en' | 'ur' | 'roman';

/**
 * Universal Dynamic Live Translation Hook
 * Automatically translates ANY new product name, category, or custom text
 * using Google Translate API + Persistent LocalStorage Caching.
 */
export function useTranslate() {
  const { language } = useI18n();
  const [, setTick] = useState(0);

  const translateProductName = useCallback((name: string): string => {
    if (!name) return name;

    // 1. Check static dictionary first (0ms)
    const staticTranslation = getProductName(name, language);
    if (staticTranslation !== name) {
      return staticTranslation;
    }

    // 2. Check sync cache (0ms)
    const cached = getCachedTranslationSync(name, language);
    if (cached !== name) {
      return cached;
    }

    // 3. Trigger live background translation if not cached yet
    if (language !== 'en') {
      fetchLiveTranslation(name, language).then((res) => {
        if (res !== name) {
          setTick(t => t + 1);
        }
      });
    }

    return name;
  }, [language]);

  const translateCategory = useCallback((category: string): string => {
    if (!category) return category;

    const staticTranslation = getCategoryName(category, language);
    if (staticTranslation !== category) {
      return staticTranslation;
    }

    const cached = getCachedTranslationSync(category, language);
    if (cached !== category) {
      return cached;
    }

    if (language !== 'en') {
      fetchLiveTranslation(category, language).then((res) => {
        if (res !== category) {
          setTick(t => t + 1);
        }
      });
    }

    return category;
  }, [language]);

  const translateCustom = useCallback((key: string, fallback: string): string => {
    if (language === 'en') return fallback;

    const cached = getCachedTranslationSync(fallback, language);
    if (cached !== fallback) {
      return cached;
    }

    fetchLiveTranslation(fallback, language).then((res) => {
      if (res !== fallback) {
        setTick(t => t + 1);
      }
    });

    return fallback;
  }, [language]);

  const translateProductNames = useCallback((names: string[]): string[] => {
    return names.map(name => translateProductName(name));
  }, [translateProductName]);

  return {
    translateProductName,
    translateCategory,
    translateCustom,
    translateProductNames,
    currentLanguage: language,
  };
}
