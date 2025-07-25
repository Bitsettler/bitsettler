import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import { getAllExtractionRecipes } from './get-all-extraction-recipes'

/**
 * Get extraction recipes that produce a specific item (for "how to obtain" functionality)
 */
export function getExtractionRecipesByOutputItemId(itemId: number): ExtractionRecipeDesc[] {
  const allRecipes = getAllExtractionRecipes()
  
  return allRecipes.filter(recipe => 
    recipe.extractedItemStacks.some(stack => stack.itemStack?.itemId === itemId)
  )
}