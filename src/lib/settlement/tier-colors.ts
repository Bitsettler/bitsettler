/**
 * Settlement-specific tier color utilities
 * Based on brico.app style with CSS custom properties
 * 
 * IMPORTANT: This is ONLY for settlement features!
 * Do NOT use this in Calculator, Codex, or other areas.
 */

// Brico.app style tier colors - common gaming tier progression
export const SETTLEMENT_TIER_COLORS = {
  0: {
    bg: 'rgb(107, 114, 128)',   // gray-500 - Basic/Default
    text: 'rgb(243, 244, 246)',  // gray-100
    border: 'rgb(75, 85, 99)',   // gray-600
    cssVar: '--bc-tier-color-0'
  },
  1: {
    bg: 'rgb(156, 163, 175)',   // gray-400 - Common
    text: 'rgb(31, 41, 55)',    // gray-800
    border: 'rgb(107, 114, 128)', // gray-500
    cssVar: '--bc-tier-color-1'
  },
  2: {
    bg: 'rgb(34, 197, 94)',     // green-500 - Uncommon
    text: 'rgb(255, 255, 255)',  // white
    border: 'rgb(21, 128, 61)',  // green-700
    cssVar: '--bc-tier-color-2'
  },
  3: {
    bg: 'rgb(59, 130, 246)',    // blue-500 - Rare
    text: 'rgb(255, 255, 255)',  // white
    border: 'rgb(29, 78, 216)',  // blue-700
    cssVar: '--bc-tier-color-3'
  },
  4: {
    bg: 'rgb(147, 51, 234)',    // purple-500 - Epic
    text: 'rgb(255, 255, 255)',  // white
    border: 'rgb(109, 40, 217)', // purple-700
    cssVar: '--bc-tier-color-4'
  },
  5: {
    bg: 'rgb(249, 115, 22)',    // orange-500 - Legendary
    text: 'rgb(255, 255, 255)',  // white
    border: 'rgb(194, 65, 12)',  // orange-700
    cssVar: '--bc-tier-color-5'
  },
  6: {
    bg: 'rgb(239, 68, 68)',     // red-500 - Mythic
    text: 'rgb(255, 255, 255)',  // white
    border: 'rgb(185, 28, 28)',  // red-700
    cssVar: '--bc-tier-color-6'
  },
  7: {
    bg: 'rgb(245, 158, 11)',    // amber-500 - Divine
    text: 'rgb(120, 53, 15)',   // amber-900
    border: 'rgb(217, 119, 6)', // amber-600
    cssVar: '--bc-tier-color-7'
  },
  8: {
    bg: 'rgb(168, 85, 247)',    // violet-500 - Celestial
    text: 'rgb(255, 255, 255)',  // white
    border: 'rgb(124, 58, 237)', // violet-700
    cssVar: '--bc-tier-color-8'
  },
  9: {
    bg: 'rgb(20, 184, 166)',    // teal-500 - Transcendent
    text: 'rgb(255, 255, 255)',  // white
    border: 'rgb(15, 118, 110)', // teal-700
    cssVar: '--bc-tier-color-9'
  },
  10: {
    bg: 'linear-gradient(135deg, rgb(236, 72, 153), rgb(168, 85, 247))', // pink to violet gradient - Ultimate
    text: 'rgb(255, 255, 255)',  // white
    border: 'rgb(190, 24, 93)',  // pink-700
    cssVar: '--bc-tier-color-10'
  }
} as const;

/**
 * Get settlement tier color classes (Tailwind-compatible)
 * Similar to brico.app's .bg-tier-bg5 pattern
 */
export function getSettlementTierColor(tier: number): string {
  const tierColor = SETTLEMENT_TIER_COLORS[tier as keyof typeof SETTLEMENT_TIER_COLORS];
  if (!tierColor) {
    return SETTLEMENT_TIER_COLORS[0].cssVar;
  }
  
  // Return CSS custom property for consistency with brico.app
  return `bg-[var(${tierColor.cssVar})] text-white border-[var(${tierColor.cssVar})]`;
}

/**
 * Get settlement tier colors as CSS custom properties
 * Call this to inject tier colors into your CSS
 */
export function getSettlementTierCssVars(): Record<string, string> {
  const cssVars: Record<string, string> = {};
  
  Object.entries(SETTLEMENT_TIER_COLORS).forEach(([tier, colors]) => {
    cssVars[colors.cssVar] = colors.bg;
  });
  
  return cssVars;
}

/**
 * Get specific tier background color (for CSS-in-JS)
 */
export function getSettlementTierBgColor(tier: number): string {
  const tierColor = SETTLEMENT_TIER_COLORS[tier as keyof typeof SETTLEMENT_TIER_COLORS];
  return tierColor?.bg || SETTLEMENT_TIER_COLORS[0].bg;
}

/**
 * Get specific tier text color (for CSS-in-JS)
 */
export function getSettlementTierTextColor(tier: number): string {
  const tierColor = SETTLEMENT_TIER_COLORS[tier as keyof typeof SETTLEMENT_TIER_COLORS];
  return tierColor?.text || SETTLEMENT_TIER_COLORS[0].text;
}

/**
 * Get tier color for badge/text display (EXACT brico.app colors!)
 * Uses CSS custom properties with exact brico.app hex codes
 * This is the settlement-specific version - ONLY use in settlement features!
 */
export function getSettlementTierBadgeClasses(tier: number): string {
  switch (tier) {
    case 0:
      return 'bg-tier-bg0 text-tier-0 border-tier-0';
    case 1:
      return 'bg-tier-bg1 text-tier-1 border-tier-1';
    case 2:
      return 'bg-tier-bg2 text-tier-2 border-tier-2';
    case 3:
      return 'bg-tier-bg3 text-tier-3 border-tier-3';
    case 4:
      return 'bg-tier-bg4 text-tier-4 border-tier-4';
    case 5:
      return 'bg-tier-bg5 text-tier-5 border-tier-5';
    case 6:
      return 'bg-tier-bg6 text-tier-6 border-tier-6';
    case 7:
      return 'bg-tier-bg7 text-tier-7 border-tier-7';
    case 8:
      return 'bg-tier-bg8 text-tier-8 border-tier-8';
    case 9:
      return 'bg-tier-bg9 text-tier-9 border-tier-9';
    case 10:
      return 'bg-tier-bg10 text-tier-10 border-tier-10';
    default:
      return 'bg-tier-bg0 text-tier-0 border-tier-0';
  }
}