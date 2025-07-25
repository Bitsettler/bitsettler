import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import craftingRecipeData from '@/data/sdk-tables/crafting_recipe_desc.json'

/**
 * Get all crafting recipes directly from SDK data (no camelCaseDeep transformation)
 */
export function getAllCraftingRecipes(): CraftingRecipeDesc[] {
  return craftingRecipeData as CraftingRecipeDesc[]
}