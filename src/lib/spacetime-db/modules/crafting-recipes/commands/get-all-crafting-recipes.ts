import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import craftingRecipeData from '@/data/global/crafting_recipe_desc.json'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'

// Convert snake_case JSON to camelCase and type properly
const craftingRecipes = camelCaseDeep<CraftingRecipeDesc[]>(craftingRecipeData)

/**
 * Get all crafting recipes
 */
export function getAllCraftingRecipes(): CraftingRecipeDesc[] {
  return craftingRecipes
}
