import { cleanIconAssetName, getServerIconPath } from '../../../shared/assets'
import { getAllItems } from '../../../utils'

export interface ItemCategoryData {
  tag: string
  count: number
  firstItem?: {
    name: string
    icon_asset_name: string
  }
}

/**
 * Get items categories command - returns categorized items data for compendium
 */
export function getItemsCategoriesCommand(): ItemCategoryData[] {
  const items = getAllItems()

  // Extract unique categories
  const categories = [...new Set(items.map((item) => item.tag))].filter(Boolean).sort()

  return categories.map((category) => {
    const categoryItems = items.filter((item) => item.tag === category)
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
