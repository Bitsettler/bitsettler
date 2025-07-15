import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemListDesc } from '@/data/bindings/item_list_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getItemPrefix } from '../shared/calculator-utils'
import type { CalculatorItem, CalculatorRecipe } from '../calculator-dtos'

/**
 * Resolve an item that might have an item_list_id to its actual outputs
 */
function resolveItemOutput(itemId: number, quantity: number, itemType: unknown, itemLists: ItemListDesc[], allItems: ItemDesc[]): Array<{ item: string; qty: number }> {
  const prefix = getItemPrefix(itemType)
  
  // Find the item to check if it has an itemListId
  const item = allItems.find(i => i.id === itemId)
  
  if (item && item.itemListId && item.itemListId !== 0) {
    // Find the corresponding item list
    const itemList = itemLists.find(list => list.id === item.itemListId)
    
    if (itemList && itemList.possibilities && itemList.possibilities.length > 0) {
      console.log(`🔍 Resolving item ${itemId} (${item.name}) using item list ${item.itemListId}`)
      
      const resolvedOutputs: Array<{ item: string; qty: number }> = []
      
      for (const possibility of itemList.possibilities) {
        if (Array.isArray(possibility) && possibility.length >= 2) {
          // Array format: [probability, items]
          const [, items] = possibility
          
          if (Array.isArray(items)) {
            for (const itemStack of items) {
              if (Array.isArray(itemStack) && itemStack.length >= 3) {
                // Array format: [itemId, quantity, itemType, durability]
                const [outputItemId, outputQuantity, outputItemType] = itemStack
                if (typeof outputItemId === 'number' && typeof outputQuantity === 'number') {
                  const outputPrefix = getItemPrefix(outputItemType)
                  resolvedOutputs.push({
                    item: `${outputPrefix}${outputItemId}`,
                    qty: outputQuantity * quantity // Scale by original quantity
                  })
                }
              }
            }
          }
        }
      }
      
      if (resolvedOutputs.length > 0) {
        console.log(`✅ Resolved ${itemId} to:`, resolvedOutputs)
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
          // Resolve potential item list outputs
          const resolvedOutputs = resolveItemOutput(itemId, quantity, itemType, itemLists, allItems)
          for (const resolvedOutput of resolvedOutputs) {
            output.push({
              item: resolvedOutput.item,
              qty: resolvedOutput.qty
            })
          }
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
        
        // itemStack structure: [unknown, [itemId, quantity, [itemType, []], [durability, []]]]
        if (Array.isArray(itemStack) && itemStack.length >= 2) {
          const [, itemDetails] = itemStack
          
          if (Array.isArray(itemDetails) && itemDetails.length >= 4) {
            const [itemId, quantity, itemTypeArray] = itemDetails
            
            if (typeof itemId === 'number' && typeof quantity === 'number') {
              // Extract item type from [itemType, []] structure
              // Pass the full itemTypeArray to getItemPrefix since it expects array format
              const prefix = getItemPrefix(itemTypeArray)
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
      
      // Debug specific recipes that should produce cargo_1000
      if ([11, 12, 14, 19, 21, 1011000, 1011002, 1012000, 1012002].includes(recipe.id)) {
        console.log(`🔍 Processing extraction recipe ${recipe.id}:`)
        console.log(`  Name: ${calculatorRecipe.name}`)
        console.log(`  Outputs: ${calculatorRecipe.output.length}`)
        calculatorRecipe.output.forEach((output, i) => {
          console.log(`    Output ${i}: ${output.item} (qty: ${output.qty}, prob: ${output.probability})`)
        })
      }
      
      if (calculatorRecipe.output.length > 0) { // Only include recipes with valid outputs
        calculatorRecipes.push(calculatorRecipe)
      }
    } catch (error) {
      console.warn(`Error processing extraction recipe ${recipe.id}:`, error)
    }
  }
  
  console.log(`📊 Total extraction recipes processed: ${calculatorRecipes.length}`)
  const cargoProducingRecipes = calculatorRecipes.filter(recipe => 
    recipe.output.some(output => output.item === 'cargo_1000')
  )
  console.log(`🪵 Recipes producing cargo_1000: ${cargoProducingRecipes.length}`)
  cargoProducingRecipes.forEach(recipe => {
    console.log(`  - Recipe ${recipe.id}: ${recipe.name}`)
  })
  
  return calculatorRecipes
}