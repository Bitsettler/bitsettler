import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import { getAllCraftingRecipes } from './get-all-crafting-recipes'

/**
 * Get crafting recipes that either consume or produce a specific item
 */
export function getCraftingRecipesByItemId(itemId: number): CraftingRecipeDesc[] {
  const allRecipes = getAllCraftingRecipes()

  return allRecipes.filter((recipe) => {
    // Check if item is consumed (input)
    const isConsumed = recipe.consumedItemStacks.some((stack) => stack.itemId === itemId)

    // Check if item is crafted (output)
    const isCrafted = recipe.craftedItemStacks.some((stack) => stack.itemId === itemId)

    return isConsumed || isCrafted
  })
}
