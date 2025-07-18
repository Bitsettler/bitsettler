import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import cargoDescData from '@/data/global/cargo_desc.json'
import { cleanIconAssetName, getServerIconPath } from '../../../shared/assets'
import { camelCaseDeep } from '../../../shared/utils/case-utils'

export interface CargoCategoryData {
  tag: string
  count: number
  firstItem?: {
    name: string
    icon_asset_name: string
  }
}

/**
 * Get cargo categories command - returns categorized cargo data for compendium
 */
export function getCargoCategoriesCommand(): CargoCategoryData[] {
  const cargoDesc = camelCaseDeep<CargoDesc[]>(cargoDescData)

  // Extract unique categories
  const categories = [...new Set(cargoDesc.map((cargo) => cargo.tag))].filter(Boolean).sort()

  return categories.map((category) => {
    const categoryItems = cargoDesc.filter((cargo) => cargo.tag === category)
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
