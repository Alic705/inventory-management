# Translation System Documentation

## Overview

This is a global, scalable translation system that works across the entire application. It automatically translates any product name, category, or custom content based on the selected language.

## How to Use

### In Any Component

```tsx
import { useTranslate } from "@/hooks/use-translate";

export function MyComponent() {
  const { translateProductName, translateCategory, currentLanguage } =
    useTranslate();

  return (
    <div>
      {/* Translate product names */}
      <p>{translateProductName("apple")}</p> {/* Shows: Apple (EN), سیب (UR), Seb (ROMAN) */}
      <p>{translateProductName("carrot")}</p>{" "}
      {/* Shows: Carrot (EN), گاجر (UR), Gajar (ROMAN) */}
      {/* Translate categories */}
      <p>{translateCategory("Sabzi")}</p>{" "}
      {/* Shows: Vegetables (EN), سبزیاں (UR), Sabziyan (ROMAN) */}
    </div>
  );
}
```

## How to Add New Translations

### For Future Products

1. Open `client/src/lib/productNames.ts`
2. Add to the appropriate section:

```typescript
// For Vegetables (Sabzi)
export const vegetableNames: Record<string, ProductNameTranslations> = {
  NewVegetable: { en: "New Vegetable", ur: "نیا سبزی", roman: "Naya Sabzi" },
};

// For Fruits (Phal)
export const fruitNames: Record<string, ProductNameTranslations> = {
  NewFruit: { en: "New Fruit", ur: "نیا پھل", roman: "Naya Phal" },
};
```

3. That's it! The system will automatically translate it everywhere.

## Key Files

### `client/src/hooks/use-translate.ts`

- The main translation hook
- Used in all components that need translations
- Functions:
  - `translateProductName(name)` - Translates product names
  - `translateCategory(category)` - Translates categories
  - `translateProductNames(names[])` - Translates arrays
  - `currentLanguage` - Returns current language

### `client/src/lib/productNames.ts`

- Central repository of all translations
- Three main sections:
  - `vegetableNames` - All vegetables/Sabzi
  - `fruitNames` - All fruits/Phal
  - `categoryNames` - Categories/Others

## Supported Languages

- `en` - English
- `ur` - Urdu (اردو)
- `roman` - Roman Urdu (Romanized)

## How It Works

### Translation Flow

```
Component calls useTranslate()
         ↓
Hook gets current language from useI18n()
         ↓
translateProductName() is called with product name
         ↓
System capitalizes first letter (apple → Apple)
         ↓
Looks up in vegetableNames/fruitNames
         ↓
Returns translated text for current language
         ↓
Component displays translated text
```

## Examples

### Adding a New Vegetable

```typescript
// In client/src/lib/productNames.ts
'Broccoli': { en: 'Broccoli', ur: 'برکولی', roman: 'Brokkoli' },
```

### Using in Component

```tsx
import { useTranslate } from "@/hooks/use-translate";

function ProductTable({ products }) {
  const { translateProductName } = useTranslate();

  return (
    <table>
      {products.map((product) => (
        <tr key={product.id}>
          <td>{translateProductName(product.name)}</td> {/* Auto translates! */}
        </tr>
      ))}
    </table>
  );
}
```

## Why This Works

1. **Case-insensitive**: `apple` and `Apple` both work
2. **Future-proof**: Add new products without changing code
3. **Global**: Works on every page automatically
4. **Automatic**: Language change immediately reflects everywhere
5. **Scalable**: Easy to extend for new languages

## Pages Using This System

- ✅ Products.tsx
- ✅ Purchases.tsx
- 🔜 Expenses.tsx (can be updated)
- 🔜 POS.tsx (can be updated)
- 🔜 Any other page needing translations
