import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows/get-calculator-game-data';

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
 */
export function resolveItemDisplay(itemName: string): { 
  iconSrc?: string; 
  tier?: number; 
  link?: string; 
  iconPath?: string; 
  calculatorLink?: string; 
} {
  try {
    const gameData = getCachedGameData();
    if (!gameData) return { iconSrc: '/assets/Unknown.webp' };
    
    const item = gameData.items.find(i => i.name?.toLowerCase().trim() === itemName?.toLowerCase().trim());
    if (!item) {
      console.log(`Item not found in game data: "${itemName}"`);
      return { iconSrc: '/assets/Unknown.webp' };
    }
    
    const iconSrc = item.icon_asset_name ? `/assets/GeneratedIcons/${item.icon_asset_name}` : '/assets/Unknown.webp';
    const link = item.slug ? `/en/compendium/items/${item.slug}` : '#';
    
    return {
      iconSrc,
      iconPath: item.icon_asset_name, // Legacy support
      tier: item.tier || 0,
      link,
      calculatorLink: item.slug ? `/calculator/${item.slug}` : undefined, // Legacy support
    };
  } catch (error) {
    console.error('Error in resolveItemDisplay:', error);
    return { iconSrc: '/assets/Unknown.webp' };
  }
}


