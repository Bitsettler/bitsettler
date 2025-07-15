import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import craftingRecipeDescData from '@/data/global/crafting_recipe_desc.json'
import extractionRecipeDescData from '@/data/global/extraction_recipe_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import cargoDescData from '@/data/global/cargo_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import { transformToCalculatorData, type CalculatorGameData } from './calculator-dtos'

/**
 * Get recipe-related data from static JSON files
 */
function getRecipeData() {
  return {
    craftingRecipeDesc: camelCaseDeep<CraftingRecipeDesc[]>(craftingRecipeDescData),
    extractionRecipeDesc: camelCaseDeep<ExtractionRecipeDesc[]>(extractionRecipeDescData),
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    cargoDesc: camelCaseDeep<CargoDesc[]>(cargoDescData),
    resourceDesc: camelCaseDeep<ResourceDesc[]>(resourceDescData)
  }
}

/**
 * Get all crafting recipes from static data
 */
export async function getCraftingRecipes(): Promise<CraftingRecipeDesc[]> {
  const { craftingRecipeDesc } = getRecipeData()
  return craftingRecipeDesc
}

/**
 * Get all extraction recipes from static data
 */
export async function getExtractionRecipes(): Promise<ExtractionRecipeDesc[]> {
  const { extractionRecipeDesc } = getRecipeData()
  return extractionRecipeDesc
}

/**
 * Get all items (including cargo and resources) from static data
 */
export async function getAllGameItems(): Promise<{
  items: ItemDesc[]
  cargo: CargoDesc[]
  resources: ResourceDesc[]
}> {
  const { itemDesc, cargoDesc, resourceDesc } = getRecipeData()
  return {
    items: itemDesc.filter(item => item.compendiumEntry),
    cargo: cargoDesc,
    resources: resourceDesc.filter(resource => resource.compendiumEntry)
  }
}

/**
 * Get calculator-ready game data from spacetime-db
 */
export async function getCalculatorGameData(): Promise<CalculatorGameData> {
  const { itemDesc, cargoDesc, resourceDesc, craftingRecipeDesc, extractionRecipeDesc } = getRecipeData()
  
  const items = itemDesc.filter(item => item.compendiumEntry)
  const resources = resourceDesc.filter(resource => resource.compendiumEntry)
  
  return transformToCalculatorData(
    items,
    cargoDesc,
    resources,
    craftingRecipeDesc,
    extractionRecipeDesc
  )
}