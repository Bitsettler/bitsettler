import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import craftingRecipeDescData from '@/data/global/crafting_recipe_desc.json'
import extractionRecipeDescData from '@/data/global/extraction_recipe_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

/**
 * Get all crafting recipes from static data
 */
export async function getCraftingRecipes(): Promise<CraftingRecipeDesc[]> {
  return camelCaseDeep<CraftingRecipeDesc[]>(craftingRecipeDescData)
}

/**
 * Get all extraction recipes from static data
 */
export async function getExtractionRecipes(): Promise<ExtractionRecipeDesc[]> {
  return camelCaseDeep<ExtractionRecipeDesc[]>(extractionRecipeDescData)
}