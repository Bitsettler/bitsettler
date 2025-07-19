import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import { searchExtractionRecipes } from './search-extraction-recipes'

/**
 * Get extraction recipes that either use or produce a specific item
 */
export function getExtractionRecipesByItemId(itemId: number): ExtractionRecipeDesc[] {
  return searchExtractionRecipes([{ inputItemId: itemId }, { outputItemId: itemId }])
}