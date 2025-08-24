import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows/get-calculator-game-data';
import itemDescData from '@/data/sdk-tables/item_desc.json';

// Cache the game data to avoid loading it repeatedly
let cachedGameData: any = null;

function getCachedGameData() {
  if (!cachedGameData) {
    try {
      cachedGameData = getCalculatorGameData();
    } catch (error) {
      console.error('Failed to load game data:', error);
      return null;
    }
  }
  return cachedGameData;
}

/**
 * Resolve icon, tier, and calculator link for a given item name.
 * First tries calculator data, then falls back to complete item database.
 */
export function resolveItemDisplay(itemName: string): { 
  iconSrc?: string; 
  tier?: number; 
  link?: string; 
  iconPath?: string; 
  calculatorLink?: string; 
} {
  try {
    // First try calculator game data (preferred for complete items with slugs)
    const gameData = getCachedGameData();
    if (gameData) {
      const item = gameData.items.find(i => i.name?.toLowerCase().trim() === itemName?.toLowerCase().trim());
      if (item) {
        const iconSrc = item.icon_asset_name ? `/assets/GeneratedIcons/${item.icon_asset_name}` : '/assets/Unknown.webp';
        const link = item.slug ? `/calculator/${item.slug}` : '#';
        
        return {
          iconSrc,
          iconPath: item.icon_asset_name,
          tier: item.tier || 0,
          link,
          calculatorLink: item.slug ? `/calculator/${item.slug}` : undefined,
        };
      }
    }
    
    // Fallback to complete item database for missing items like crafting reagents
    const fallbackItem = itemDescData.find((i: any) => i.name?.toLowerCase().trim() === itemName?.toLowerCase().trim());
    if (fallbackItem) {
      const iconSrc = fallbackItem.iconAssetName ? `/assets/GeneratedIcons/${fallbackItem.iconAssetName}` : '/assets/Unknown.webp';
      
      return {
        iconSrc,
        iconPath: fallbackItem.iconAssetName,
        tier: fallbackItem.tier || 0,
        link: '#', // No calculator link for fallback items (they're usually crafting reagents)
        calculatorLink: undefined,
      };
    }
    
    // Final fallback - item truly not found
    if (!window.missingItems) window.missingItems = new Set();
    if (!window.missingItems.has(itemName)) {
      console.log(`Item "${itemName}" not found in any data source`);
      window.missingItems.add(itemName);
    }
    
    return { 
      iconSrc: '/assets/Unknown.webp',
      link: '#',
      tier: 0 
    };
    
  } catch (error) {
    console.error('Error in resolveItemDisplay:', error);
    return { iconSrc: '/assets/Unknown.webp' };
  }
}


