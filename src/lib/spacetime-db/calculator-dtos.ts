import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { createSlug } from './entities'
import { convertRarityToString } from './rarity'

// Calculator-specific DTOs
export interface CalculatorItem {
  id: string
  name: string
  slug: string
  tier: number
  rarity: string
  category: string
  description: string
  icon_asset_name: string
}

export interface CalculatorRecipe {
  id: number
  name: string
  requirements: {
    professions?: string
    tool?: string
    building?: string
    materials: Array<{ id: string; qty: number | null }>
  }
  output: Array<{
    item: string
    qty: number | number[] | null
    probability?: number
  }>
}

export interface CalculatorGameData {
  items: CalculatorItem[]
  recipes: CalculatorRecipe[]
}

/**
 * Map ItemDesc to CalculatorItem
 */
export function mapItemToCalculatorItem(item: ItemDesc): CalculatorItem {
  return {
    id: item.id.toString(),
    name: item.name,
    slug: createSlug(item.name),
    tier: item.tier,
    rarity: convertRarityToString(item.rarity),
    category: 'items',
    description: item.description,
    icon_asset_name: item.iconAssetName || 'Unknown'
  }
}

/**
 * Map CargoDesc to CalculatorItem
 */
export function mapCargoToCalculatorItem(cargo: CargoDesc): CalculatorItem {
  return {
    id: cargo.id.toString(),
    name: cargo.name,
    slug: createSlug(cargo.name),
    tier: cargo.tier,
    rarity: convertRarityToString(cargo.rarity),
    category: 'cargo',
    description: cargo.description,
    icon_asset_name: cargo.iconAssetName || 'Unknown'
  }
}

/**
 * Map ResourceDesc to CalculatorItem
 */
export function mapResourceToCalculatorItem(resource: ResourceDesc): CalculatorItem {
  return {
    id: resource.id.toString(),
    name: resource.name,
    slug: createSlug(resource.name),
    tier: resource.tier,
    rarity: convertRarityToString(resource.rarity),
    category: 'resources',
    description: resource.description,
    icon_asset_name: resource.iconAssetName || 'Unknown'
  }
}

/**
 * Map CraftingRecipeDesc to CalculatorRecipe
 */
export function mapCraftingRecipeToCalculatorRecipe(
  recipe: CraftingRecipeDesc,
  allItems: Map<number, CalculatorItem>
): CalculatorRecipe {
  // Extract materials from consumedItemStacks
  const materials: Array<{ id: string; qty: number | null }> = []
  
  if (Array.isArray(recipe.consumedItemStacks)) {
    for (const stack of recipe.consumedItemStacks) {
      if (Array.isArray(stack) && stack.length >= 2) {
        const [itemId, quantity] = stack
        if (typeof itemId === 'number' && typeof quantity === 'number') {
          materials.push({
            id: itemId.toString(),
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
      if (Array.isArray(stack) && stack.length >= 2) {
        const [itemId, quantity] = stack
        if (typeof itemId === 'number' && typeof quantity === 'number') {
          const item = allItems.get(itemId)
          if (item) {
            output.push({
              item: item.id, // Use item.id to maintain compatibility with existing hooks
              qty: quantity
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
  allItems: Map<number, CalculatorItem>,
  allResources: Map<number, CalculatorItem>
): CalculatorRecipe {
  // For extraction recipes, the resource being extracted is the "material"
  const materials: Array<{ id: string; qty: number | null }> = []
  
  if (recipe.resourceId && allResources.has(recipe.resourceId)) {
    materials.push({
      id: recipe.resourceId.toString(),
      qty: null // Resources don't have specific quantities needed
    })
  }

  // Extract outputs from extractedItemStacks
  const output: Array<{ item: string; qty: number | number[] | null; probability?: number }> = []
  
  if (Array.isArray(recipe.extractedItemStacks)) {
    for (const stackEntry of recipe.extractedItemStacks) {
      if (Array.isArray(stackEntry) && stackEntry.length >= 2) {
        const [stackData, probability] = stackEntry
        
        if (Array.isArray(stackData) && stackData.length >= 2) {
          const [, itemData] = stackData
          if (Array.isArray(itemData) && itemData.length >= 2) {
            const [itemId, quantity] = itemData
            
            if (typeof itemId === 'number' && typeof quantity === 'number') {
              const item = allItems.get(itemId)
              if (item) {
                output.push({
                  item: item.id, // Use item.id to maintain compatibility with existing hooks
                  qty: quantity,
                  probability: typeof probability === 'number' ? probability : undefined
                })
              }
            }
          }
        }
      }
    }
  }

  // Generate a meaningful name for the extraction recipe
  const resourceName = allResources.get(recipe.resourceId)?.name || 'Unknown Resource'
  const recipeName = `Extract from ${resourceName}`

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
 * Transform spacetime-db data to calculator format
 */
export function transformToCalculatorData(
  items: ItemDesc[],
  cargo: CargoDesc[],
  resources: ResourceDesc[],
  craftingRecipes: CraftingRecipeDesc[],
  extractionRecipes: ExtractionRecipeDesc[]
): CalculatorGameData {
  // Create maps for efficient lookup
  const allItemsMap = new Map<number, CalculatorItem>()
  const allResourcesMap = new Map<number, CalculatorItem>()
  
  // Transform and map items
  const calculatorItems: CalculatorItem[] = []
  
  // Add items
  for (const item of items) {
    const calculatorItem = mapItemToCalculatorItem(item)
    calculatorItems.push(calculatorItem)
    allItemsMap.set(item.id, calculatorItem)
  }
  
  // Add cargo
  for (const cargoItem of cargo) {
    const calculatorItem = mapCargoToCalculatorItem(cargoItem)
    calculatorItems.push(calculatorItem)
    allItemsMap.set(cargoItem.id, calculatorItem)
  }
  
  // Add resources
  for (const resource of resources) {
    const calculatorItem = mapResourceToCalculatorItem(resource)
    calculatorItems.push(calculatorItem)
    allItemsMap.set(resource.id, calculatorItem)
    allResourcesMap.set(resource.id, calculatorItem)
  }
  
  // Transform recipes
  const calculatorRecipes: CalculatorRecipe[] = []
  
  // Add crafting recipes
  for (const recipe of craftingRecipes) {
    const calculatorRecipe = mapCraftingRecipeToCalculatorRecipe(recipe, allItemsMap)
    if (calculatorRecipe.output.length > 0) { // Only include recipes with valid outputs
      calculatorRecipes.push(calculatorRecipe)
    }
  }
  
  // Add extraction recipes
  for (const recipe of extractionRecipes) {
    const calculatorRecipe = mapExtractionRecipeToCalculatorRecipe(recipe, allItemsMap, allResourcesMap)
    if (calculatorRecipe.output.length > 0) { // Only include recipes with valid outputs
      calculatorRecipes.push(calculatorRecipe)
    }
  }
  
  return {
    items: calculatorItems,
    recipes: calculatorRecipes
  }
}