import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import resourceDescData from '@/data/global/resource_desc.json'
import { cleanIconAssetName, getServerIconPath } from '../../../shared/assets'
import { camelCaseDeep } from '../../../shared/utils/case-utils'

export interface ResourceCategoryData {
  tag: string
  count: number
  firstItem?: {
    name: string
    icon_asset_name: string
  }
}

/**
 * Get resource categories command - returns categorized resources data for compendium
 */
export function getResourcesCategoriesCommand(): ResourceCategoryData[] {
  const resourceDesc = camelCaseDeep<ResourceDesc[]>(resourceDescData)
  const compendiumResources = resourceDesc.filter((resource) => resource.compendiumEntry)

  // Extract unique categories
  const categories = [...new Set(compendiumResources.map((resource) => resource.tag))].filter(Boolean).sort()

  return categories.map((category) => {
    const categoryItems = compendiumResources.filter((resource) => resource.tag === category)
    const firstItem = categoryItems[0]

    return {
      tag: category,
      count: categoryItems.length,
      firstItem: firstItem
        ? {
            name: firstItem.name,
            icon_asset_name: getServerIconPath(cleanIconAssetName(firstItem.iconAssetName))
          }
        : undefined
    }
  })
}
