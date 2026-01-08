/**
 * Automatic Translation Service using Translation API
 * No need to manually maintain translations!
 * 
 * Three Solutions:
 * 1. Google Translate API (Paid but reliable)
 * 2. LibreTranslate (Free, open-source)
 * 3. OpenAI API (If you have access)
 */

// ============================================
// SOLUTION 1: Using LibreTranslate (FREE & EASY)
// ============================================

interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
}

export async function translateText(
  text: string,
  targetLanguage: 'en' | 'ur' | 'roman'
): Promise<string> {
  try {
    // LibreTranslate API endpoint (free, public)
    const response = await fetch('https://api.libretranslate.de/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLanguage === 'ur' ? 'ur' : targetLanguage === 'roman' ? 'en' : 'en',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json()) as TranslationResult;
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

// ============================================
// SOLUTION 2: Using Cache to Avoid Repeated API Calls
// ============================================

interface CacheEntry {
  text: string;
  language: 'en' | 'ur' | 'roman';
  result: string;
  timestamp: number;
}

class TranslationCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  getCacheKey(text: string, language: string): string {
    return `${text}:${language}`;
  }

  get(text: string, language: 'en' | 'ur' | 'roman'): string | null {
    const key = this.getCacheKey(text, language);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if cache is expired
    if (Date.now() - entry.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  set(text: string, language: 'en' | 'ur' | 'roman', result: string): void {
    const key = this.getCacheKey(text, language);
    this.cache.set(key, {
      text,
      language,
      result,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const translationCache = new TranslationCache();

// ============================================
// SOLUTION 3: Cached Translation Function
// ============================================

export async function getTranslation(
  text: string,
  targetLanguage: 'en' | 'ur' | 'roman'
): Promise<string> {
  if (targetLanguage === 'en') return text; // No translation needed for English

  // Check cache first
  const cached = translationCache.get(text, targetLanguage);
  if (cached) {
    return cached;
  }

  // If not in cache, fetch from API
  const translated = await translateText(text, targetLanguage);

  // Store in cache
  translationCache.set(text, targetLanguage, translated);

  return translated;
}
