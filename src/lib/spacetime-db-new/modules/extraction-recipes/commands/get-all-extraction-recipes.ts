import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import extractionRecipeData from '@/data/sdk-tables/extraction_recipe_desc.json'

/**
 * Get all extraction recipes directly from SDK data (no camelCaseDeep transformation)
 */
export function getAllExtractionRecipes(): ExtractionRecipeDesc[] {
  return extractionRecipeData as ExtractionRecipeDesc[]
}