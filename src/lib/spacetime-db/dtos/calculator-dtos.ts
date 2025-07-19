import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { mapCargoToCalculatorItem } from '../modules/cargo/cargo'
import { mapItemToCalculatorItem } from '../modules/items/commands'
import {
  mapCraftingRecipeToCalculatorRecipe,
  mapExtractionRecipeToCalculatorRecipe,
  transformCraftingRecipesToCalculator,
  transformExtractionRecipesToCalculator
} from '../modules/recipes/calculator'
import { mapResourceToCalculatorItem } from '../modules/resources/commands'
import { createUnifiedLookup } from '../shared/calculator-utils'

// Re-export module functions for backward compatibility
export {
  mapCargoToCalculatorItem,
  mapCraftingRecipeToCalculatorRecipe,
  mapExtractionRecipeToCalculatorRecipe,
  mapItemToCalculatorItem,
  mapResourceToCalculatorItem
}

// Calculator-specific DTOs
export interface CalculatorItem {
  id: string
  name: string
  slug: string
  tier: number
  rarity: string
  category: string
  description: string
  icon_asset_name: string
}

export interface CalculatorRecipe {
  id: number
  name: string
  requirements: {
    professions?: string
    tool?: string
    building?: string
    materials: Array<{ id: string; qty: number | null }>
  }
  output: Array<{
    item: string
    qty: number | number[] | null
    probability?: number
  }>
}

export interface CalculatorGameData {
  items: CalculatorItem[]
  recipes: CalculatorRecipe[]
}

/**
 * Transform spacetime-db data to calculator format
 */
export function transformToCalculatorData(
  items: ItemDesc[],
  cargo: CargoDesc[],
  resources: ResourceDesc[],
  craftingRecipes: CraftingRecipeDesc[],
  extractionRecipes: ExtractionRecipeDesc[]
): CalculatorGameData {
  // Create unified lookup for all entities
  const unifiedLookup = createUnifiedLookup(
    items,
    cargo,
    resources,
    mapItemToCalculatorItem,
    mapCargoToCalculatorItem,
    mapResourceToCalculatorItem
  )

  // Transform items to calculator format
  const calculatorItems: CalculatorItem[] = Array.from(unifiedLookup.values())

  // Transform recipes using module-specific functions
  const calculatorCraftingRecipes = transformCraftingRecipesToCalculator(craftingRecipes)
  const calculatorExtractionRecipes = transformExtractionRecipesToCalculator(extractionRecipes, unifiedLookup)
  const calculatorRecipes = [...calculatorCraftingRecipes, ...calculatorExtractionRecipes]

  return {
    items: calculatorItems,
    recipes: calculatorRecipes
  }
}
