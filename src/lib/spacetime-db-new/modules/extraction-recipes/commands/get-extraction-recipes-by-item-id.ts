import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import { getAllExtractionRecipes } from './get-all-extraction-recipes'

/**
 * Get extraction recipes that either consume or produce a specific item
 */
export function getExtractionRecipesByItemId(
  itemId: number
): ExtractionRecipeDesc[] {
  const allRecipes = getAllExtractionRecipes()

  return allRecipes.filter((recipe) => {
    // Check if item is consumed (input)
    const isConsumed = recipe.consumedItemStacks.some(
      (stack) => stack.itemId === itemId
    )

    // Check if item is extracted (output)
    const isExtracted = recipe.extractedItemStacks.some(
      (stack) => stack.itemStack?.itemId === itemId
    )

    return isConsumed || isExtracted
  })
}
