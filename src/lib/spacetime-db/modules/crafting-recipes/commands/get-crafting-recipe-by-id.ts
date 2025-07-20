import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import { getAllCraftingRecipes } from './get-all-crafting-recipes'

/**
 * Get crafting recipe by ID
 */
export function getCraftingRecipeById(id: number): CraftingRecipeDesc | null {
  const craftingRecipes = getAllCraftingRecipes()
  return craftingRecipes.find((recipe) => recipe.id === id) || null
}
