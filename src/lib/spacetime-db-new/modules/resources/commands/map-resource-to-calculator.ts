import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { cleanIconAssetName, getServerIconPath } from '../../../shared/assets'
import type { CalculatorItem } from '../../../shared/dtos/calculator-dtos'
import { createSlug } from '../../../shared/utils/entities'

/**
 * Map ResourceDesc to CalculatorItem
 */
export function mapResourceToCalculatorItem(resource: ResourceDesc): CalculatorItem {
  return {
    id: `resource_${resource.id}`,
    name: resource.name,
    slug: createSlug(resource.name),
    tier: resource.tier,
    rarity: resource.rarity.tag.toLowerCase(),
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
