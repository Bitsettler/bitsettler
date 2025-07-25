import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import { getAllCraftingRecipes } from './get-all-crafting-recipes'

/**
 * Get crafting recipes that produce a specific item (for "how to obtain" functionality)
 */
export function getCraftingRecipesByOutputItemId(itemId: number): CraftingRecipeDesc[] {
  const allRecipes = getAllCraftingRecipes()
  
  return allRecipes.filter(recipe => 
    recipe.craftedItemStacks.some(stack => stack.itemId === itemId)
  )
}