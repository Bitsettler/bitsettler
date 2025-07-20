import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import { searchCraftingRecipes } from './search-crafting-recipes'

/**
 * Get recipes that either use or produce a specific item
 */
export function getCraftingRecipesByItemId(itemId: number): CraftingRecipeDesc[] {
  return searchCraftingRecipes([{ inputItemId: itemId }, { outputItemId: itemId }])
}
