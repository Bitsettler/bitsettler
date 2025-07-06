import items from '@/data/items.json'
import { Recipe } from '@/lib/types'
import type { Node } from '@xyflow/react'

export const resolveRecipeName = (recipe: Recipe, allItems: typeof items): string => {
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

export const updateNodeQuantities = (nodes: Node[], selectedItem: { id: number }, targetQuantity: number): Node[] => {
  if (!selectedItem) return nodes

  // First, update the selected item's quantity
  let updatedNodes = nodes.map((node) => {
    if (node.id === selectedItem.id.toString()) {
      return {
        ...node,
        data: {
          ...node.data,
          quantity: targetQuantity
        }
      }
    }
    return node
  })

  // Keep updating until no more changes occur (to handle deep nesting)
  let hasChanges = true
  let iterations = 0
  const maxIterations = 10 // Prevent infinite loops

  while (hasChanges && iterations < maxIterations) {
    const previousQuantities = updatedNodes.map((n) => ({ id: n.id, quantity: n.data.quantity }))

    // Update all material nodes based on their parent requirements
    updatedNodes = updatedNodes.map((node) => {
      // Skip if this is the selected item or doesn't have an itemId
      if (node.id === selectedItem.id.toString() || !node.data.itemId) {
        return node
      }

      // Find all parent nodes that use this material
      const parentNodes = updatedNodes.filter((parentNode) => {
        if (!parentNode.data.selectedRecipe) return false
        const recipe = parentNode.data.selectedRecipe as Recipe
        return recipe.requirements.materials?.some((mat) => mat.id === node.data.itemId)
      })

      // Calculate total quantity needed for this material from all parent nodes
      let totalQuantityNeeded = 0

      parentNodes.forEach((parentNode) => {
        const recipe = parentNode.data.selectedRecipe as Recipe
        const materialReq = recipe.requirements.materials?.find((mat) => mat.id === node.data.itemId)

        if (materialReq && materialReq.qty !== null && materialReq.qty !== undefined) {
          const parentQuantity = (parentNode.data.quantity as number) || 1

          // Calculate how many times we need to run this recipe
          const outputItem = recipe.output?.find((output) => output.item === parentNode.data.itemId)
          const outputQty = outputItem ? (Array.isArray(outputItem.qty) ? outputItem.qty[0] : outputItem.qty) || 1 : 1
          const recipeRuns = Math.ceil(parentQuantity / outputQty)

          totalQuantityNeeded += recipeRuns * materialReq.qty
        }
      })

      // Update quantity for materials that need it
      if (totalQuantityNeeded > 0 && node.data.category !== 'resources') {
        return {
          ...node,
          data: {
            ...node.data,
            quantity: totalQuantityNeeded
          }
        }
      } else if (node.data.category === 'resources') {
        // For resources, remove the quantity
        return {
          ...node,
          data: {
            ...node.data,
            quantity: undefined
          }
        }
      }

      return node
    })

    // Check if any quantities changed
    const currentQuantities = updatedNodes.map((n) => ({ id: n.id, quantity: n.data.quantity }))
    hasChanges = JSON.stringify(previousQuantities) !== JSON.stringify(currentQuantities)
    iterations++
  }

  return updatedNodes
}
