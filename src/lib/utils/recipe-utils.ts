import itemsData from '@/data/global/item_desc.json'
import { Recipe } from '@/lib/types'
import type { Node, Edge } from '@xyflow/react'

// Type definition for item_desc.json structure
interface ItemDesc {
  id: number
  name: string
  description: string
  volume: number
  durability: number
  convert_to_on_durability_zero: number
  secondary_knowledge_id: number
  model_asset_name: string
  icon_asset_name: string
  tier: number
  tag: string
  rarity: unknown[]
  compendium_entry: boolean
  item_list_id: number
}

const items: ItemDesc[] = itemsData as ItemDesc[]

// Generic item type for resolveRecipeName function
interface ItemWithIdAndName {
  id: string | number
  name: string
}

export const resolveRecipeName = (recipe: Recipe, allItems: ItemWithIdAndName[] = items): string => {
  let resolvedName = recipe.name

  // Replace {0} with output item name
  if (recipe.output && recipe.output.length > 0) {
    const outputItem = allItems.find((item) => item.id === recipe.output[0].item)
    if (outputItem) {
      resolvedName = resolvedName.replace(/\{0\}/g, outputItem.name)
    }
  }

  // Replace {1} with first input material name
  if (recipe.requirements.materials && recipe.requirements.materials.length > 0) {
    const firstMaterial = recipe.requirements.materials[0]
    if (firstMaterial.id) {
      const materialItem = allItems.find((item) => item.id === firstMaterial.id)
      if (materialItem) {
        resolvedName = resolvedName.replace(/\{1\}/g, materialItem.name)
      }
    }
  }

  // Replace {2} with second input material name (if exists)
  if (recipe.requirements.materials && recipe.requirements.materials.length > 1) {
    const secondMaterial = recipe.requirements.materials[1]
    if (secondMaterial.id) {
      const materialItem = allItems.find((item) => item.id === secondMaterial.id)
      if (materialItem) {
        resolvedName = resolvedName.replace(/\{2\}/g, materialItem.name)
      }
    }
  }

  // Replace {3} with third input material name (if exists)
  if (recipe.requirements.materials && recipe.requirements.materials.length > 2) {
    const thirdMaterial = recipe.requirements.materials[2]
    if (thirdMaterial.id) {
      const materialItem = allItems.find((item) => item.id === thirdMaterial.id)
      if (materialItem) {
        resolvedName = resolvedName.replace(/\{3\}/g, materialItem.name)
      }
    }
  }

  return resolvedName
}

export const calculateQuantitiesFromEdges = (nodes: Node[], edges: Edge[], selectedItem: { id: string }, targetQuantity: number): Node[] => {
  if (!selectedItem) return nodes

  // Create a map to accumulate quantities for each node
  const quantityMap = new Map<string, number>()
  
  // Set the root item's quantity
  quantityMap.set(selectedItem.id, targetQuantity)

  // Find all nodes that have no incoming edges (root nodes)
  const incomingEdges = new Map<string, string[]>()
  edges.forEach(edge => {
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

    const currentNode = nodes.find(n => n.id === currentNodeId)
    if (!currentNode) continue

    const recipe = currentNode.data.selectedRecipe as Recipe
    if (!recipe || !recipe.requirements.materials) continue

    const currentQuantity = quantityMap.get(currentNodeId) || 0
    if (currentQuantity === 0) continue

    // Calculate how many times we need to run this recipe
    const outputItem = recipe.output?.find((output) => output.item === currentNode.data.itemId)
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
    if (node.data.category === 'resources') {
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
        quantity: calculatedQuantity !== undefined ? calculatedQuantity : node.data.quantity
      }
    }
  })
}

