import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { createUnifiedLookup } from './shared/calculator-utils'
import { mapItemToCalculatorItem } from './items/calculator'
import { mapCargoToCalculatorItem } from './cargo/calculator'
import { mapResourceToCalculatorItem } from './resources/calculator'
import { transformCraftingRecipesToCalculator, transformExtractionRecipesToCalculator, mapCraftingRecipeToCalculatorRecipe, mapExtractionRecipeToCalculatorRecipe } from './recipes/calculator'

// Re-export module functions for backward compatibility
export { mapItemToCalculatorItem, mapCargoToCalculatorItem, mapResourceToCalculatorItem, mapCraftingRecipeToCalculatorRecipe, mapExtractionRecipeToCalculatorRecipe }

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
  
  console.log(`Transformed ${calculatorItems.length} items and ${calculatorRecipes.length} recipes (${craftingRecipes.length} crafting, ${extractionRecipes.length} extraction)`)
  
  return {
    items: calculatorItems,
    recipes: calculatorRecipes
  }
}