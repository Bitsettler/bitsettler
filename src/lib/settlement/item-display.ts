import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows/get-calculator-game-data';

/**
 * Resolve icon, tier, and calculator link for a given item name.
 */
export function resolveItemDisplay(itemName: string): { iconPath?: string; tier?: number; calculatorLink?: string } {
  try {
    const gameData = getCalculatorGameData();
    const item = gameData.items.find(i => i.name?.toLowerCase().trim() === itemName?.toLowerCase().trim());
    if (!item) return {};
    return {
      iconPath: item.icon_asset_name,
      tier: item.tier || 0,
      calculatorLink: item.slug ? `/calculator/${item.slug}` : undefined,
    };
  } catch {
    return {};
  }
}


