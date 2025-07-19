import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import { getAllCraftingRecipes } from './get-all-crafting-recipes'

/**
 * Search filter interface for direct property-based filtering
 */
export interface CraftingRecipeSearchFilter {
  inputItemId?: number
  outputItemId?: number
  id?: number
  buildingType?: number
  toolType?: number
  requiredKnowledgeId?: number
}

/**
 * Search crafting recipes with flexible filtering
 * 
 * @param filters Array of filter objects
 * - If multiple objects in array: OR logic (any object can match)
 * - If multiple properties in one object: AND logic (all properties must match)
 * 
 * Examples:
 * - searchCraftingRecipes([{ inputItemId: 1010001 }, { outputItemId: 1010001 }]) - recipes with item 1010001 in input OR output
 * - searchCraftingRecipes([{ inputItemId: 1010001, outputItemId: 1010002 }]) - recipes with item 1010001 in input AND item 1010002 in output
 */
export function searchCraftingRecipes(filters: CraftingRecipeSearchFilter[]): CraftingRecipeDesc[] {
  const craftingRecipes = getAllCraftingRecipes()
  
  if (!filters || filters.length === 0) {
    return craftingRecipes
  }

  return craftingRecipes.filter(recipe => {
    // OR logic: at least one filter object must match
    return filters.some(filter => {
      // AND logic: all properties in this filter object must match
      return Object.entries(filter).every(([key, value]) => {
        if (value === undefined) return true
        
        switch (key) {
          case 'id':
            return recipe.id === value
          
          case 'buildingType':
            return recipe.buildingRequirement?.buildingType === value
          
          case 'toolType':
            return recipe.toolRequirements.some(tool => tool.toolType === value)
          
          case 'requiredKnowledgeId':
            return recipe.requiredKnowledges.includes(value as number)
          
          case 'inputItemId':
            return recipe.consumedItemStacks.some(stack => 
              Array.isArray(stack) && stack[0] === value
            )
          
          case 'outputItemId':
            return recipe.craftedItemStacks.some(stack => 
              Array.isArray(stack) && stack[0] === value
            )
          
          default:
            return true
        }
      })
    })
  })
}