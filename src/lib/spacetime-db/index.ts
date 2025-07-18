// Main data access functions
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ItemListDesc } from '@/data/bindings/item_list_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import cargoDescData from '@/data/global/cargo_desc.json'
import craftingRecipeDescData from '@/data/global/crafting_recipe_desc.json'
import extractionRecipeDescData from '@/data/global/extraction_recipe_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import itemListDescData from '@/data/global/item_list_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'
import { mapCargoToCalculatorItem, transformCargoToCalculator } from './modules/cargo/calculator'
import { transformCargoToSearch } from './modules/cargo/search'
import { transformCollectionsToSearch } from './modules/collections/search'
import { mapItemToCalculatorItem, transformItemsToCalculator } from './modules/items/calculator'
import { transformItemsToSearch } from './modules/items/search'
import { transformCraftingRecipesToCalculator, transformExtractionRecipesToCalculator } from './modules/recipes/calculator'
import { mapResourceToCalculatorItem, transformResourcesToCalculator } from './modules/resources/calculator'
import { transformResourcesToSearch } from './modules/resources/search'
import { createUnifiedLookup, shouldFilterItem } from './shared/calculator-utils'
import type { CalculatorGameData } from './shared/dtos/calculator-dtos'
import { transformToSearchData, type SearchData } from './shared/dtos/search-dtos'

function getGameData() {
  return {
    craftingRecipeDesc: camelCaseDeep<CraftingRecipeDesc[]>(craftingRecipeDescData),
    extractionRecipeDesc: camelCaseDeep<ExtractionRecipeDesc[]>(extractionRecipeDescData),
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    cargoDesc: camelCaseDeep<CargoDesc[]>(cargoDescData),
    resourceDesc: camelCaseDeep<ResourceDesc[]>(resourceDescData),
    itemListDesc: camelCaseDeep<ItemListDesc[]>(itemListDescData)
  }
}

export async function getSearchGameData(): Promise<SearchData> {
  const { itemDesc, cargoDesc, resourceDesc } = getGameData()

  // Filter items for compendium entries
  const filteredItems = itemDesc.filter((item) => item.compendiumEntry)
  const filteredResources = resourceDesc.filter((resource) => resource.compendiumEntry)
  const filteredCargo = cargoDesc.filter((cargo) => !shouldFilterItem(cargo))

  // Transform each module using module-specific search functions
  const searchItems = transformItemsToSearch(filteredItems)
  const searchCargo = transformCargoToSearch(filteredCargo)
  const searchResources = transformResourcesToSearch(filteredResources)
  const searchCollections = transformCollectionsToSearch()

  return transformToSearchData(searchItems, searchCargo, searchResources, searchCollections)
}

export function getCalculatorGameData(): CalculatorGameData {
  const { itemDesc, cargoDesc, resourceDesc, craftingRecipeDesc, extractionRecipeDesc, itemListDesc } = getGameData()

  // Filter items for compendium entries
  const filteredItems = itemDesc.filter((item) => item.compendiumEntry)
  const filteredResources = resourceDesc.filter((resource) => resource.compendiumEntry)
  const filteredCargo = cargoDesc.filter((cargo) => !shouldFilterItem(cargo))

  // Transform each module using module-specific functions
  const calculatorItems = transformItemsToCalculator(filteredItems)
  const calculatorCargo = transformCargoToCalculator(filteredCargo)
  const calculatorResources = transformResourcesToCalculator(filteredResources)

  // Combine all items for unified lookup
  const allCalculatorItems = [...calculatorItems, ...calculatorCargo, ...calculatorResources]

  // Create unified lookup for recipe processing
  const unifiedLookup = createUnifiedLookup(
    filteredItems,
    filteredCargo,
    filteredResources,
    mapItemToCalculatorItem,
    mapCargoToCalculatorItem,
    mapResourceToCalculatorItem
  )

  // Transform recipes using module-specific functions
  const calculatorCraftingRecipes = transformCraftingRecipesToCalculator(craftingRecipeDesc, itemListDesc, itemDesc)
  const calculatorExtractionRecipes = transformExtractionRecipesToCalculator(extractionRecipeDesc, unifiedLookup)
  const allCalculatorRecipes = [...calculatorCraftingRecipes, ...calculatorExtractionRecipes]

  return {
    items: allCalculatorItems,
    recipes: allCalculatorRecipes
  }
}

// Re-export utilities for consolidated access
export { assetExists, cleanIconAssetName, getFallbackIconPath, getServerIconPath } from './shared/assets'
export type { CalculatorGameData, CalculatorItem, CalculatorRecipe } from './shared/dtos/calculator-dtos'
export type { SearchData, SearchItem } from './shared/dtos/search-dtos'
export { createSlug, getTierColor } from './shared/utils/entities'

// Re-export module-specific calculator functions
export { mapCargoToCalculatorItem, transformCargoToCalculator } from './modules/cargo/calculator'
export {
  findTagCollection,
  getEquipmentTags,
  getWeaponTags,
  tagCollections,
  type TagCategory,
  type TagCollection
} from './modules/collections/item-tag-collections'
export { mapItemToCalculatorItem, transformItemsToCalculator } from './modules/items/calculator'
export {
  getAllProfessions,
  getProfessionById,
  getProfessionBySlug,
  getProfessionsByCategory,
  getProfessionsByType,
  getProfessionStats,
  type Profession
} from './modules/professions/professions'
export {
  mapCraftingRecipeToCalculatorRecipe,
  mapExtractionRecipeToCalculatorRecipe,
  transformCraftingRecipesToCalculator,
  transformExtractionRecipesToCalculator
} from './modules/recipes/calculator'
export { mapResourceToCalculatorItem, transformResourcesToCalculator } from './modules/resources/calculator'
export { cleanIconAssetPath, createUnifiedLookup, getItemPrefix, shouldFilterItem } from './shared/calculator-utils'
export {
  convertRarityArrayToString,
  convertRarityToString,
  getRarityColor,
  getRarityDisplayName
} from './shared/utils/rarity'

// Re-export search functions
export { mapCargoToSearchItem, transformCargoToSearch } from './modules/cargo/search'
export { transformCollectionsToSearch } from './modules/collections/search'
export { mapItemToSearchItem, transformItemsToSearch } from './modules/items/search'
export { mapResourceToSearchItem, transformResourcesToSearch } from './modules/resources/search'

// Re-export main transformation function for backward compatibility
export {
  getWeaponItems,
  getWeaponsGroupedByCategory,
  getWeaponsGroupedByType,
  getWeaponStatistics,
  getWeaponStats,
  getWeaponsWithStats,
  getWeaponTypeById,
  getWeaponTypeName,
  getWeaponTypes,
  isHuntingWeaponType,
  type WeaponWithItem
} from './modules/collections/weapons'
export { transformToCalculatorData } from './shared/dtos/calculator-dtos'
export { getAllCargo, getAllItems, getItemsByTags } from './utils'
