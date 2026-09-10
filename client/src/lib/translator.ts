/**
 * High-Performance Dynamic Live Translation Engine
 * 1. Persistent localStorage cache (0ms lookup)
 * 2. Instant dictionary lookup
 * 3. Free Google Translate API & MyMemory Fallback
 */

type TargetLanguage = 'en' | 'ur' | 'roman';

const CACHE_KEY = 'project_fixer_translation_cache_v1';

// Load cache from localStorage
function loadPersistentCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// Save cache to localStorage
function savePersistentCache(cache: Record<string, string>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save translation cache to localStorage', e);
  }
}

const memoryCache: Record<string, string> = loadPersistentCache();

/**
 * Common English to Roman Urdu dictionary helper for dynamic words
 */
const romanDictionary: Record<string, string> = {
  apple: 'Seb',
  banana: 'Kela',
  orange: 'Santra',
  mango: 'Aam',
  grapes: 'Angoor',
  watermelon: 'Tarbuz',
  melon: 'Kharbuza',
  guava: 'Amrood',
  pomegranate: 'Anar',
  papaya: 'Papita',
  pineapple: 'Ananas',
  strawberry: 'Strawberry',
  peach: 'Aadu',
  plum: 'Aloo Bukhara',
  pear: 'Nashpati',
  dates: 'Khajoor',
  coconut: 'Nariyal',
  tomato: 'Tamatar',
  onion: 'Piyaz',
  potato: 'Aloo',
  carrot: 'Gajar',
  cabbage: 'Band Gobhi',
  cauliflower: 'Phool Gobhi',
  spinach: 'Palak',
  coriander: 'Dhaniya',
  mint: 'Pudina',
  'green chili': 'Hari Mirch',
  'red chili': 'Lal Mirch',
  ginger: 'Adrak',
  garlic: 'Lehsun',
  cucumber: 'Kheera',
  radish: 'Mooli',
  turnip: 'Shalgam',
  okra: 'Bhindi',
  eggplant: 'Baingan',
  'bell pepper': 'Shimla Mirch',
  peas: 'Matar',
  beans: 'Phaliyan',
  lemon: 'Lemon',
  lime: 'Neebu',
  milk: 'Doodh',
  curd: 'Dahi',
  yogurt: 'Dahi',
  butter: 'Makhan',
  ghee: 'Ghee',
  cheese: 'Paneer',
  egg: 'Anda',
  bread: 'Double Roti',
  flour: 'Aata',
  rice: 'Chawal',
  sugar: 'Cheeni',
  salt: 'Namak',
  tea: 'Chai',
  water: 'Paani',
  juice: 'Juice',
  oil: 'Cooking Oil',
  chicken: 'Chicken',
  beef: 'Bara Gosht',
  mutton: 'Chota Gosht',
  fish: 'Machli',
};

/**
 * Fetch live translation from free Google Translate API (gtx) or MyMemory
 */
export async function fetchLiveTranslation(
  text: string,
  targetLanguage: TargetLanguage
): Promise<string> {
  if (!text || !text.trim() || targetLanguage === 'en') {
    return text;
  }

  const cleanText = text.trim();
  const cacheKey = `${cleanText.toLowerCase()}:${targetLanguage}`;

  // Check persistent cache
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey];
  }

  // Handle Roman Urdu logic
  if (targetLanguage === 'roman') {
    const lower = cleanText.toLowerCase();
    if (romanDictionary[lower]) {
      const res = romanDictionary[lower];
      memoryCache[cacheKey] = res;
      savePersistentCache(memoryCache);
      return res;
    }
  }

  try {
    // 1. Try Google Translate Free API (gtx)
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ur&dt=t&q=${encodeURIComponent(cleanText)}`;
    const res = await fetch(googleUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translatedUrdu = data[0][0][0];
        const finalResult = targetLanguage === 'ur' ? translatedUrdu : cleanText;
        memoryCache[cacheKey] = finalResult;
        savePersistentCache(memoryCache);
        return finalResult;
      }
    }
  } catch (err) {
    console.warn('Google Translate API fallback trying MyMemory...', err);
  }

  try {
    // 2. Fallback: MyMemory Free Translation API
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|ur`;
    const res = await fetch(myMemoryUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const translatedUrdu = data.responseData.translatedText;
        const finalResult = targetLanguage === 'ur' ? translatedUrdu : cleanText;
        memoryCache[cacheKey] = finalResult;
        savePersistentCache(memoryCache);
        return finalResult;
      }
    }
  } catch (err) {
    console.warn('MyMemory translation error:', err);
  }

  return cleanText;
}

/**
 * Synchronous cache lookup or fallback
 */
export function getCachedTranslationSync(text: string, targetLanguage: TargetLanguage): string {
  if (!text || targetLanguage === 'en') return text;
  const cleanText = text.trim();
  const cacheKey = `${cleanText.toLowerCase()}:${targetLanguage}`;
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey];
  }
  return text;
}
