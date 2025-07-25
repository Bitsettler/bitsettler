import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import extractionRecipeData from '@/data/global/extraction_recipe_desc.json'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'

// Convert snake_case JSON to camelCase and type properly
const extractionRecipes = camelCaseDeep<ExtractionRecipeDesc[]>(extractionRecipeData)

/**
 * Get all extraction recipes
 */
export function getAllExtractionRecipes(): ExtractionRecipeDesc[] {
  return extractionRecipes
}
