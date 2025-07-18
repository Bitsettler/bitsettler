import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import type { CalculatorItem } from './dtos/calculator-dtos'

/**
 * Clean up malformed icon asset paths (from scripts/items/map-items.ts)
 */
export function cleanIconAssetPath(iconAssetName: string): string {
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
export function shouldFilterItem(item: ItemDesc | CargoDesc | ResourceDesc): boolean {
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
 * Get the correct item prefix based on item type (from scripts/recipes/map-extraction-recipes.ts)
 */
export function getItemPrefix(itemType: unknown): string {
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
export function createUnifiedLookup(
  items: ItemDesc[], 
  cargo: CargoDesc[], 
  resources: ResourceDesc[],
  mapItemToCalculatorItem: (item: ItemDesc) => CalculatorItem,
  mapCargoToCalculatorItem: (cargo: CargoDesc) => CalculatorItem,
  mapResourceToCalculatorItem: (resource: ResourceDesc) => CalculatorItem
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