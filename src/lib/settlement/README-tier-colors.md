# Settlement Tier Colors - EXACT Brico.app Colors!

This system provides **settlement-specific** tier colors using the EXACT hex codes from brico.app's implementation with CSS custom properties.

## ⚠️ IMPORTANT: Settlement Only!

These utilities are **ONLY** for settlement features. Do **NOT** use in:
- Calculator
- Codex  
- Other areas outside settlements

## Files Structure

```
src/
├── lib/settlement/tier-colors.ts          # TypeScript utilities
├── styles/settlement-tiers.css            # CSS custom properties
└── components/ui/tier-icon.tsx            # Game badge components
```

## Usage Examples

### Brico-style Icons (Recommended - EXACT brico.app colors!)
```tsx
// Roman numerals with tier colors - EXACT brico.app hex codes
<SettlementTierIcon tier={6} />        // Large "VI" with #983a44 background
<ItemTierIcon tier={3} />              // Small "III" with #5c6f4d background  
<ProjectTierIcon tier={5} />           // Medium "V" with #814f87 background

// Or generic
<TierIcon tier={6} variant="brico-style" size="lg" />   // "VI" with tier color
```

### Game Asset Icons (raw game graphics)
```tsx
// Uses actual game badge images from /public/assets/Badges/
<TierIcon tier={6} variant="game-asset" size="md" />
```

### Text Badges (When you need "Tier X" text)
```tsx
<TierIcon tier={5} variant="text-badge" showTierText />
<TierBadge tier={5} showTierText />
```

### CSS Classes (Brico.app style)
```css
/* Background colors */
.bg-tier-bg5 { background-color: var(--bc-tier-color-5); }

/* Complete tier badge */
.tier-badge-5 {
  background-color: var(--bc-tier-color-5);
  color: var(--bc-tier-text-5);
  border-color: var(--bc-tier-border-5);
}
```

### TypeScript Utilities
```tsx
import { getSettlementTierBadgeClasses, getSettlementTierBgColor } from '@/lib/settlement/tier-colors';

// Get Tailwind classes
const classes = getSettlementTierBadgeClasses(5);

// Get CSS color value
const bgColor = getSettlementTierBgColor(5);
```

## Tier Color Progression - EXACT Brico.app Hex Codes

| Tier | Hex Code | Rarity |
|------|----------|--------|
| 0 | #6b7280 | Basic |
| 1 | #636a74 | Common |
| 2 | #875f45 | Uncommon |
| 3 | #5c6f4d | Rare |
| 4 | #49619c | Epic |
| 5 | #814f87 | Legendary |
| 6 | #983a44 | Mythic |
| 7 | #947014 | Divine |
| 8 | #538484 | Celestial |
| 9 | #464953 | Transcendent |
| 10 | #97afbe | Ultimate |

## ✅ VERIFIED Colors

These are the EXACT hex codes from brico.app/#/database/items:
- Extracted directly from brico.app's CSS
- Implemented in `src/styles/settlement-tiers.css`
- Used by `src/lib/settlement/tier-colors.ts`

## Implementation Notes

- ✅ Uses EXACT brico.app hex codes (#983a44, #5c6f4d, etc.)
- ✅ Uses actual game badge assets from `/public/assets/Badges/`
- ✅ CSS custom properties like brico.app (`--bc-tier-color-5`)
- ✅ Compartmentalized to settlement features only
- ✅ Game badge + text badge options
- ✅ Proper TypeScript types and utilities
- 🎯 **100% COLOR ACCURATE** to brico.app