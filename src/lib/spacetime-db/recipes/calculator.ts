import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import { getItemPrefix } from '../shared/calculator-utils'
import type { CalculatorItem, CalculatorRecipe } from '../calculator-dtos'

/**
 * Map CraftingRecipeDesc to CalculatorRecipe
 */
export function mapCraftingRecipeToCalculatorRecipe(
  recipe: CraftingRecipeDesc
): CalculatorRecipe {
  // Extract materials from consumedItemStacks
  const materials: Array<{ id: string; qty: number | null }> = []
  
  if (Array.isArray(recipe.consumedItemStacks)) {
    for (const stack of recipe.consumedItemStacks) {
      // Array format: [itemId, quantity, itemType, discoveryScore, consumptionChance]
      if (Array.isArray(stack) && stack.length >= 3) {
        const [itemId, quantity, itemType] = stack
        if (typeof itemId === 'number' && typeof quantity === 'number') {
          const prefix = getItemPrefix(itemType)
          materials.push({
            id: `${prefix}${itemId}`,
            qty: quantity
          })
        }
      }
    }
  }

  // Extract outputs from craftedItemStacks
  const output: Array<{ item: string; qty: number | number[] | null; probability?: number }> = []
  
  if (Array.isArray(recipe.craftedItemStacks)) {
    for (const stack of recipe.craftedItemStacks) {
      // Array format: [itemId, quantity, itemType, durability]
      if (Array.isArray(stack) && stack.length >= 3) {
        const [itemId, quantity, itemType] = stack
        if (typeof itemId === 'number' && typeof quantity === 'number') {
          const prefix = getItemPrefix(itemType)
          output.push({
            item: `${prefix}${itemId}`,
            qty: quantity
          })
        }
      }
    }
  }

  return {
    id: recipe.id,
    name: recipe.name,
    requirements: {
      materials
    },
    output
  }
}

/**
 * Map ExtractionRecipeDesc to CalculatorRecipe
 */
export function mapExtractionRecipeToCalculatorRecipe(
  recipe: ExtractionRecipeDesc,
  unifiedLookup: Map<string, CalculatorItem>
): CalculatorRecipe {
  // For extraction recipes, the resource being extracted is the "material"
  const materials: Array<{ id: string; qty: number | null }> = []
  
  // Add consumed items (materials used in extraction)
  if (Array.isArray(recipe.consumedItemStacks)) {
    for (const stack of recipe.consumedItemStacks) {
      // Array format: [itemId, quantity, itemType, discoveryScore, consumptionChance]
      if (Array.isArray(stack) && stack.length >= 3) {
        const [itemId, quantity, itemType] = stack
        if (typeof itemId === 'number' && typeof quantity === 'number') {
          const prefix = getItemPrefix(itemType)
          materials.push({
            id: `${prefix}${itemId}`,
            qty: quantity
          })
        }
      }
    }
  }

  // Add the resource being extracted as a material
  if (recipe.resourceId) {
    materials.push({
      id: `resource_${recipe.resourceId}`,
      qty: null // Resources don't have specific quantities needed
    })
  }

  // Extract outputs from extractedItemStacks
  const output: Array<{ item: string; qty: number | number[] | null; probability?: number }> = []
  
  if (Array.isArray(recipe.extractedItemStacks)) {
    for (const stackEntry of recipe.extractedItemStacks) {
      // Array format: [itemStack, probability]
      if (Array.isArray(stackEntry) && stackEntry.length >= 2) {
        const [itemStack, probability] = stackEntry
        
        // itemStack is also an array: [itemId, quantity, itemType, durability]
        if (Array.isArray(itemStack) && itemStack.length >= 3) {
          const [itemId, quantity, itemType] = itemStack
          
          if (typeof itemId === 'number' && typeof quantity === 'number') {
            const prefix = getItemPrefix(itemType)
            output.push({
              item: `${prefix}${itemId}`,
              qty: quantity,
              probability: typeof probability === 'number' ? probability : undefined
            })
          }
        }
      }
    }
  }

  // Generate a meaningful name for the extraction recipe
  const resourceName = unifiedLookup.get(`resource_${recipe.resourceId}`)?.name || 'Unknown Resource'
  const recipeName = recipe.verbPhrase ? `${recipe.verbPhrase} ${resourceName}` : `Extract from ${resourceName}`

  return {
    id: recipe.id,
    name: recipeName,
    requirements: {
      materials
    },
    output
  }
}

/**
 * Transform crafting recipes to calculator format
 */
export function transformCraftingRecipesToCalculator(
  recipes: CraftingRecipeDesc[]
): CalculatorRecipe[] {
  const calculatorRecipes: CalculatorRecipe[] = []
  
  for (const recipe of recipes) {
    try {
      const calculatorRecipe = mapCraftingRecipeToCalculatorRecipe(recipe)
      if (calculatorRecipe.output.length > 0) { // Only include recipes with valid outputs
        calculatorRecipes.push(calculatorRecipe)
      }
    } catch (error) {
      console.warn(`Error processing crafting recipe ${recipe.id}:`, error)
    }
  }
  
  return calculatorRecipes
}

/**
 * Transform extraction recipes to calculator format
 */
export function transformExtractionRecipesToCalculator(
  recipes: ExtractionRecipeDesc[],
  unifiedLookup: Map<string, CalculatorItem>
): CalculatorRecipe[] {
  const calculatorRecipes: CalculatorRecipe[] = []
  
  for (const recipe of recipes) {
    try {
      const calculatorRecipe = mapExtractionRecipeToCalculatorRecipe(recipe, unifiedLookup)
      if (calculatorRecipe.output.length > 0) { // Only include recipes with valid outputs
        calculatorRecipes.push(calculatorRecipe)
      }
    } catch (error) {
      console.warn(`Error processing extraction recipe ${recipe.id}:`, error)
    }
  }
  
  return calculatorRecipes
}