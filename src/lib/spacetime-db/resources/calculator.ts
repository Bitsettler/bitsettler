import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { createSlug } from '../entities'
import { convertRarityToString } from '../rarity'
import { getServerIconPath, cleanIconAssetName } from '../assets'
import type { CalculatorItem } from '../calculator-dtos'

/**
 * Map ResourceDesc to CalculatorItem
 */
export function mapResourceToCalculatorItem(resource: ResourceDesc): CalculatorItem {
  return {
    id: `resource_${resource.id}`,
    name: resource.name,
    slug: createSlug(resource.name),
    tier: resource.tier,
    rarity: convertRarityToString(resource.rarity),
    category: 'resources',
    description: resource.description || 'No description available',
    icon_asset_name: getServerIconPath(cleanIconAssetName(resource.iconAssetName || ''))
  }
}

/**
 * Transform resources to calculator format
 */
export function transformResourcesToCalculator(resources: ResourceDesc[]): CalculatorItem[] {
  return resources.map(mapResourceToCalculatorItem)
}