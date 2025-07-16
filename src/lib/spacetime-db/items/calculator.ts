import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { createSlug } from '../entities'
import { convertRarityToString } from '../rarity'
import { getServerIconPath, cleanIconAssetName } from '../assets'
import type { CalculatorItem } from '../calculator-dtos'

/**
 * Map ItemDesc to CalculatorItem
 */
export function mapItemToCalculatorItem(item: ItemDesc): CalculatorItem {
  return {
    id: `item_${item.id}`,
    name: item.name,
    slug: createSlug(item.name),
    tier: item.tier,
    rarity: convertRarityToString(item.rarity),
    category: 'items',
    description: item.description || 'No description available',
    icon_asset_name: getServerIconPath(cleanIconAssetName(item.iconAssetName || ''))
  }
}

/**
 * Transform items to calculator format
 */
export function transformItemsToCalculator(items: ItemDesc[]): CalculatorItem[] {
  return items.map(mapItemToCalculatorItem)
}