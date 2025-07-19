import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import { getAllExtractionRecipes } from './get-all-extraction-recipes'

/**
 * Search filter interface for direct property-based filtering
 */
export interface ExtractionRecipeSearchFilter {
  inputItemId?: number
  outputItemId?: number
  id?: number
  resourceId?: number
  cargoId?: number
  toolType?: number
  requiredKnowledgeId?: number
}

/**
 * Search extraction recipes with flexible filtering
 * 
 * @param filters Array of filter objects
 * - If multiple objects in array: OR logic (any object can match)
 * - If multiple properties in one object: AND logic (all properties must match)
 * 
 * Examples:
 * - searchExtractionRecipes([{ inputItemId: 1010001 }, { outputItemId: 1010001 }]) - recipes with item 1010001 in input OR output
 * - searchExtractionRecipes([{ inputItemId: 1010001, outputItemId: 1010002 }]) - recipes with item 1010001 in input AND item 1010002 in output
 */
export function searchExtractionRecipes(filters: ExtractionRecipeSearchFilter[]): ExtractionRecipeDesc[] {
  const extractionRecipes = getAllExtractionRecipes()
  
  if (!filters || filters.length === 0) {
    return extractionRecipes
  }

  return extractionRecipes.filter(recipe => {
    // OR logic: at least one filter object must match
    return filters.some(filter => {
      // AND logic: all properties in this filter object must match
      return Object.entries(filter).every(([key, value]) => {
        if (value === undefined) return true
        
        switch (key) {
          case 'id':
            return recipe.id === value
          
          case 'resourceId':
            return recipe.resourceId === value
          
          case 'cargoId':
            return recipe.cargoId === value
          
          case 'toolType':
            return recipe.toolRequirements.some(tool => tool.toolType === value)
          
          case 'requiredKnowledgeId':
            return recipe.requiredKnowledges.includes(value as number)
          
          case 'inputItemId':
            return recipe.consumedItemStacks.some(stack => 
              Array.isArray(stack) && stack[0] === value
            )
          
          case 'outputItemId':
            return recipe.extractedItemStacks.some(stackEntry => {
              if (Array.isArray(stackEntry) && stackEntry.length >= 2) {
                const [itemStack] = stackEntry
                if (Array.isArray(itemStack) && itemStack.length >= 2) {
                  const [, itemDetails] = itemStack
                  if (Array.isArray(itemDetails) && itemDetails.length >= 1) {
                    return itemDetails[0] === value
                  }
                }
              }
              return false
            })
          
          default:
            return true
        }
      })
    })
  })
}