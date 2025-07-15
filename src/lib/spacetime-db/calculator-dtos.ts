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
 * Clean up malformed icon asset paths (from scripts/items/map-items.ts)
 */
function cleanIconAssetPath(iconAssetName: string): string {
  if (!iconAssetName) return 'Unknown'

  // Fix the common issue where "GeneratedIcons/Other/GeneratedIcons" is duplicated
  let cleanPath = iconAssetName.replace('GeneratedIcons/Other/GeneratedIcons', 'GeneratedIcons')

  // Handle missing deed icon - the AncientDeed.webp file doesn't exist
  if (cleanPath === 'Items/AncientDeed') {
    cleanPath = 'Unknown'
  }

  return cleanPath
}

/**
 * Check if an item should be filtered out (recipes, loot tables, etc.)
 * (from scripts/items/map-items.ts)
 */
function shouldFilterItem(item: ItemDesc | CargoDesc | ResourceDesc): boolean {
  // Filter out items with "Output" suffix (recipe outputs)
  if (item.name.includes('Output')) {
    return true
  }

  // Filter out items with item_list_id (loot table containers, not actual items)
  if ('itemListId' in item && item.itemListId != null && item.itemListId !== 0) {
    return true
  }

  // Only include items marked for compendium entry
  if ('compendiumEntry' in item && !item.compendiumEntry) {
    return true
  }

  return false
}

/**
 * Map ItemDesc to CalculatorItem
 */
export function mapItemToCalculatorItem(item: ItemDesc): CalculatorItem {
  return {
    id: `item_${item.id}`,
    name: item.name,
    slug: createSlug(item.name),
    tier: item.tier,
    rarity: convertRarityToString(item.rarity),
    category: 'items',
    description: item.description || 'No description available',
    icon_asset_name: cleanIconAssetPath(item.iconAssetName || '')
  }
}

/**
 * Map CargoDesc to CalculatorItem
 */
export function mapCargoToCalculatorItem(cargo: CargoDesc): CalculatorItem {
  return {
    id: `cargo_${cargo.id}`,
    name: cargo.name,
    slug: createSlug(cargo.name),
    tier: cargo.tier,
    rarity: convertRarityToString(cargo.rarity),
    category: 'cargo',
    description: cargo.description || 'No description available',
    icon_asset_name: cleanIconAssetPath(cargo.iconAssetName || '')
  }
}

/**
 * Map ResourceDesc to CalculatorItem
 */
export function mapResourceToCalculatorItem(resource: ResourceDesc): CalculatorItem {
  return {
    id: `resource_${resource.id}`,
    name: resource.name,
    slug: createSlug(resource.name),
    tier: resource.tier,
    rarity: convertRarityToString(resource.rarity),
    category: 'resources',
    description: resource.description || 'No description available',
    icon_asset_name: cleanIconAssetPath(resource.iconAssetName || '')
  }
}

/**
 * Get the correct item prefix based on item type (from scripts/recipes/map-extraction-recipes.ts)
 */
function getItemPrefix(itemType: unknown): string {
  // SpacetimeDB format: [variant_index, variant_data]
  if (Array.isArray(itemType) && itemType.length >= 1) {
    const variantIndex = itemType[0]
    switch (variantIndex) {
      case 0:
        return 'item_' // Item variant
      case 1:
        return 'cargo_' // Cargo variant
      default:
        console.warn(`Unknown item type variant index: ${variantIndex}, defaulting to item_`)
        return 'item_'
    }
  }

  // Legacy format with tag property
  if (typeof itemType === 'object' && itemType && 'tag' in itemType) {
    const tag = (itemType as { tag: string }).tag
    switch (tag) {
      case 'Item':
        return 'item_'
      case 'Cargo':
        return 'cargo_'
      default:
        console.warn(`Unknown item type: ${tag}, defaulting to item_`)
        return 'item_'
    }
  }

  // Fallback for old format or missing type
  console.warn(`Unknown item type format:`, itemType, `defaulting to item_`)
  return 'item_'
}

/**
 * Create a unified lookup for all entities by prefixed ID
 */
function createUnifiedLookup(
  items: ItemDesc[], 
  cargo: CargoDesc[], 
  resources: ResourceDesc[]
): Map<string, CalculatorItem> {
  const lookup = new Map<string, CalculatorItem>()
  
  // Add items
  for (const item of items) {
    if (!shouldFilterItem(item)) {
      const calculatorItem = mapItemToCalculatorItem(item)
      lookup.set(calculatorItem.id, calculatorItem) // Use prefixed ID as key
    }
  }
  
  // Add cargo
  for (const cargoItem of cargo) {
    if (!shouldFilterItem(cargoItem)) {
      const calculatorItem = mapCargoToCalculatorItem(cargoItem)
      lookup.set(calculatorItem.id, calculatorItem) // Use prefixed ID as key
    }
  }
  
  // Add resources
  for (const resource of resources) {
    if (!shouldFilterItem(resource)) {
      const calculatorItem = mapResourceToCalculatorItem(resource)
      lookup.set(calculatorItem.id, calculatorItem) // Use prefixed ID as key
    }
  }
  
  return lookup
}

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
      if (Array.isArray(stack) && stack.length >= 4) {
        const [itemId, quantity, itemType] = stack
        if (typeof itemId === 'number' && typeof quantity === 'number') {
          // Use the correct prefix based on itemType
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
      if (Array.isArray(stack) && stack.length >= 4) {
        const [itemId, quantity, itemType] = stack
        if (typeof itemId === 'number' && typeof quantity === 'number') {
          // Use the correct prefix based on itemType
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
      if (Array.isArray(stack) && stack.length >= 4) {
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
      if (Array.isArray(stackEntry) && stackEntry.length >= 2) {
        const [stackData, probability] = stackEntry
        
        if (Array.isArray(stackData) && stackData.length >= 2) {
          const [, itemInfo] = stackData
          if (Array.isArray(itemInfo) && itemInfo.length >= 3) {
            const [itemId, quantity, itemType] = itemInfo
            
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
 * Transform spacetime-db data to calculator format
 */
export function transformToCalculatorData(
  items: ItemDesc[],
  cargo: CargoDesc[],
  resources: ResourceDesc[],
  craftingRecipes: CraftingRecipeDesc[],
  extractionRecipes: ExtractionRecipeDesc[]
): CalculatorGameData {
  // Create unified lookup for all entities
  const unifiedLookup = createUnifiedLookup(items, cargo, resources)
  
  // Transform items to calculator format
  const calculatorItems: CalculatorItem[] = Array.from(unifiedLookup.values())
  
  // Transform recipes
  const calculatorRecipes: CalculatorRecipe[] = []
  
  // Add crafting recipes
  for (const recipe of craftingRecipes) {
    try {
      const calculatorRecipe = mapCraftingRecipeToCalculatorRecipe(recipe)
      if (calculatorRecipe.output.length > 0) { // Only include recipes with valid outputs
        calculatorRecipes.push(calculatorRecipe)
        
      }
    } catch (error) {
      console.warn(`Error processing crafting recipe ${recipe.id}:`, error)
    }
  }
  
  // Add extraction recipes
  for (const recipe of extractionRecipes) {
    try {
      const calculatorRecipe = mapExtractionRecipeToCalculatorRecipe(recipe, unifiedLookup)
      if (calculatorRecipe.output.length > 0) { // Only include recipes with valid outputs
        calculatorRecipes.push(calculatorRecipe)
      }
    } catch (error) {
      console.warn(`Error processing extraction recipe ${recipe.id}:`, error)
    }
  }
  
  console.log(`Transformed ${calculatorItems.length} items and ${calculatorRecipes.length} recipes (${craftingRecipes.length} crafting, ${extractionRecipes.length} extraction)`)
  
  console.log(`Transformed ${calculatorItems.length} items and ${calculatorRecipes.length} recipes`)
  
  return {
    items: calculatorItems,
    recipes: calculatorRecipes
  }
}