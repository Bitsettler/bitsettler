import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ItemListDesc } from '@/data/bindings/item_list_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { Edge, Node } from '@xyflow/react'
import type { CalculatorItem, CalculatorRecipe } from './dtos/calculator-dtos'

// More specific typings for the data object we store on each React Flow node
export interface FlowNodeData {
  [key: string]: unknown
  itemId: string
  category: string
  quantity?: number
  recipes?: CalculatorRecipe[]
  selectedRecipe?: CalculatorRecipe | null
  isDone?: boolean
  isHovered?: boolean
}

/**
 * Check if an item should be filtered out (recipes, loot tables, etc.)
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
 * Get the correct item prefix based on item type
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

/**
 * Resolve an item that might have an item_list_id to its actual outputs
 */
export function resolveItemOutput(
  itemId: number,
  quantity: number,
  itemType: { tag: string; value: object },
  itemLists: ItemListDesc[],
  allItems: ItemDesc[]
): Array<{ item: string; qty: number }> {
  // Determine prefix based on itemType
  const isItem = itemType.tag === 'Item'
  const prefix = isItem ? 'item_' : 'cargo_'

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
              const outputIsItem = itemStack.itemType.tag === 'Item'
              const outputPrefix = outputIsItem ? 'item_' : 'cargo_'
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
 * Resolve recipe name placeholders with actual item names
 * Based on pattern analysis: {0} = first crafted item, {1} = first consumed item, etc.
 */
export function resolveRecipeName(
  recipeName: string,
  craftedItems: Array<{ itemId: number; item?: { name: string } }>,
  consumedItems: Array<{ itemId: number; item?: { name: string } }>
): string {
  let resolvedName = recipeName

  // Create a combined array for placeholder replacement
  // Index 0+ = crafted items, then consumed items
  const allItems = [...craftedItems, ...consumedItems]

  // Replace all placeholders {0}, {1}, {2}, etc.
  allItems.forEach((item, index) => {
    const placeholder = `{${index}}`
    const itemName = item.item?.name || `Item ${item.itemId}`
    resolvedName = resolvedName.replace(placeholder, itemName)
  })

  return resolvedName
}

/**
 * Resolve recipe name for calculator recipes
 * Extracts crafted and consumed items from CalculatorRecipe format
 */
export function resolveCalculatorRecipeName(recipe: CalculatorRecipe, itemsLookup?: CalculatorItem[]): string {
  // Create lookup map for fast item retrieval
  const itemsMap = itemsLookup ? new Map(itemsLookup.map((item) => [item.id, item])) : new Map()

  // Extract crafted items from output
  const craftedItems = recipe.output.map((output) => ({
    itemId: parseInt(output.item),
    item: itemsMap.get(output.item)
  }))

  // Extract consumed items from materials
  const consumedItems =
    recipe.requirements.materials?.map((material) => ({
      itemId: parseInt(material.id),
      item: itemsMap.get(material.id)
    })) || []

  return resolveRecipeName(recipe.name, craftedItems, consumedItems)
}

/**
 * Calculate quantities for nodes based on edges and target quantity
 * This mirrors the original implementation from spacetime-db/modules/recipes/recipe-utils.ts
 */
export function calculateQuantitiesFromEdges(
  nodes: Node[],
  edges: Edge[],
  selectedItem: { id: string },
  targetQuantity: number
): Node[] {
  if (!selectedItem) return nodes

  // Create a map to accumulate quantities for each node
  const quantityMap = new Map<string, number>()

  // Set the root item's quantity
  quantityMap.set(selectedItem.id, targetQuantity)

  // Find all nodes that have no incoming edges (root nodes)
  const incomingEdges = new Map<string, string[]>()
  edges.forEach((edge) => {
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, [])
    }
    incomingEdges.get(edge.target)!.push(edge.source)
  })

  // Create a queue for processing nodes in dependency order
  const processQueue = [selectedItem.id]
  const processed = new Set<string>()

  while (processQueue.length > 0) {
    const currentNodeId = processQueue.shift()!

    if (processed.has(currentNodeId)) continue
    processed.add(currentNodeId)

    const currentNode = nodes.find((n) => n.id === currentNodeId)
    if (!currentNode) continue

    const currentNodeData = currentNode.data as FlowNodeData
    const recipe = currentNodeData.selectedRecipe
    if (!recipe || !recipe.requirements?.materials) continue

    const currentQuantity = quantityMap.get(currentNodeId) || 0
    if (currentQuantity === 0) continue

    // Calculate how many times we need to run this recipe
    const outputItem = recipe.output?.find((output) => output.item === currentNodeData.itemId)
    const outputQty = outputItem ? (Array.isArray(outputItem.qty) ? outputItem.qty[0] : outputItem.qty) || 1 : 1
    const recipeRuns = Math.ceil(currentQuantity / outputQty)

    // Process each material required by this recipe
    recipe.requirements.materials.forEach((material) => {
      const materialId = material.id.toString()
      const materialQuantity = material.qty || 0

      if (materialQuantity > 0) {
        const totalMaterialNeeded = recipeRuns * materialQuantity

        // Accumulate quantity for this material
        const existingQuantity = quantityMap.get(materialId) || 0
        quantityMap.set(materialId, existingQuantity + totalMaterialNeeded)

        // Add to processing queue if not already processed
        if (!processed.has(materialId)) {
          processQueue.push(materialId)
        }
      }
    })
  }

  // Update all nodes with calculated quantities
  return nodes.map((node) => {
    const nodeId = node.id
    const calculatedQuantity = quantityMap.get(nodeId)

    // For resources, don't show quantity
    const nodeData = (node.data as FlowNodeData) || {}
    if (nodeData.category === 'resources' || nodeData.category === 'resource') {
      return {
        ...node,
        data: {
          ...node.data,
          quantity: undefined
        }
      }
    }

    // For other nodes, use calculated quantity or existing quantity
    return {
      ...node,
      data: {
        ...node.data,
        quantity: calculatedQuantity !== undefined ? calculatedQuantity : nodeData.quantity
      }
    }
  })
}
