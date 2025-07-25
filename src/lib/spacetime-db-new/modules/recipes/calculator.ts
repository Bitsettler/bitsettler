import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ItemListDesc } from '@/data/bindings/item_list_desc_type'
import { getItemPrefix } from '../../shared/calculator-utils'
import type { CalculatorItem, CalculatorRecipe } from '../../shared/dtos/calculator-dtos'

/**
 * Resolve an item that might have an item_list_id to its actual outputs
 */
function resolveItemOutput(
  itemId: number,
  quantity: number,
  itemType: unknown,
  itemLists: ItemListDesc[],
  allItems: ItemDesc[]
): Array<{ item: string; qty: number }> {
  const prefix = getItemPrefix(itemType)

  // Find the item to check if it has an itemListId
  const item = allItems.find((i) => i.id === itemId)

  if (item && item.itemListId && item.itemListId !== 0) {
    // Find the corresponding item list
    const itemList = itemLists.find((list) => list.id === item.itemListId)

    if (itemList && itemList.possibilities && itemList.possibilities.length > 0) {
      const resolvedOutputs: Array<{ item: string; qty: number }> = []

      for (const possibility of itemList.possibilities) {
        if (possibility.items && Array.isArray(possibility.items)) {
          for (const itemStack of possibility.items) {
            if (itemStack.itemId && typeof itemStack.quantity === 'number') {
              // Determine prefix for the resolved item
              const outputPrefix = getItemPrefix(itemStack.itemType)
              resolvedOutputs.push({
                item: `${outputPrefix}${itemStack.itemId}`,
                qty: itemStack.quantity * quantity // Scale by original quantity
              })
            }
          }
        }
      }

      if (resolvedOutputs.length > 0) {
        return resolvedOutputs
      }
    }
  }

  // Fallback to default output
  return [{ item: `${prefix}${itemId}`, qty: quantity }]
}

/**
 * Map CraftingRecipeDesc to CalculatorRecipe
 */
export function mapCraftingRecipeToCalculatorRecipe(
  recipe: CraftingRecipeDesc,
  itemLists: ItemListDesc[] = [],
  allItems: ItemDesc[] = []
): CalculatorRecipe {
  // Extract materials from consumedItemStacks
  const materials: Array<{ id: string; qty: number | null }> = []

  if (recipe.consumedItemStacks && Array.isArray(recipe.consumedItemStacks)) {
    for (const stack of recipe.consumedItemStacks) {
      if (stack.itemId && typeof stack.quantity === 'number') {
        const prefix = getItemPrefix(stack.itemType)
        materials.push({
          id: `${prefix}${stack.itemId}`,
          qty: stack.quantity
        })
      }
    }
  }

  // Extract outputs from craftedItemStacks
  const output: Array<{ item: string; qty: number | number[] | null; probability?: number }> = []

  if (recipe.craftedItemStacks && Array.isArray(recipe.craftedItemStacks)) {
    for (const stack of recipe.craftedItemStacks) {
      if (stack.itemId && typeof stack.quantity === 'number') {
        // Resolve potential item list outputs
        const resolvedOutputs = resolveItemOutput(stack.itemId, stack.quantity, stack.itemType, itemLists, allItems)
        for (const resolvedOutput of resolvedOutputs) {
          output.push({
            item: resolvedOutput.item,
            qty: resolvedOutput.qty
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
  if (recipe.consumedItemStacks && Array.isArray(recipe.consumedItemStacks)) {
    for (const stack of recipe.consumedItemStacks) {
      if (stack.itemId && typeof stack.quantity === 'number') {
        const prefix = getItemPrefix(stack.itemType)
        materials.push({
          id: `${prefix}${stack.itemId}`,
          qty: stack.quantity
        })
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

  if (recipe.extractedItemStacks && Array.isArray(recipe.extractedItemStacks)) {
    for (const stackEntry of recipe.extractedItemStacks) {
      if (stackEntry.itemStack && stackEntry.itemStack.itemId && typeof stackEntry.itemStack.quantity === 'number') {
        // Determine prefix for the output item
        const prefix = getItemPrefix(stackEntry.itemStack.itemType)
        output.push({
          item: `${prefix}${stackEntry.itemStack.itemId}`,
          qty: stackEntry.itemStack.quantity,
          probability: typeof stackEntry.probability === 'number' ? stackEntry.probability : undefined
        })
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
  recipes: CraftingRecipeDesc[],
  itemLists: ItemListDesc[] = [],
  allItems: ItemDesc[] = []
): CalculatorRecipe[] {
  const calculatorRecipes: CalculatorRecipe[] = []

  for (const recipe of recipes) {
    try {
      const calculatorRecipe = mapCraftingRecipeToCalculatorRecipe(recipe, itemLists, allItems)
      if (calculatorRecipe.output.length > 0) {
        // Only include recipes with valid outputs
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

      if (calculatorRecipe.output.length > 0) {
        // Only include recipes with valid outputs
        calculatorRecipes.push(calculatorRecipe)
      }
    } catch (error) {
      console.warn(`Error processing extraction recipe ${recipe.id}:`, error)
    }
  }

  return calculatorRecipes
}
