import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { cleanIconAssetName, getServerIconPath } from '../../../shared/assets'
import type { CalculatorItem } from '../../../shared/dtos/calculator-dtos'
import { createSlug } from '../../../shared/utils/entities'

/**
 * Map ItemDesc to CalculatorItem
 */
export function mapItemToCalculatorItem(item: ItemDesc): CalculatorItem {
  return {
    id: `item_${item.id}`,
    name: item.name,
    slug: createSlug(item.name),
    tier: item.tier,
    rarity: item.rarity.tag.toLowerCase(),
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
