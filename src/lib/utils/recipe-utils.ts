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

export const updateNodeQuantities = (
  nodes: Node[],
  selectedItem: { id: number },
  targetQuantity: number,
  recipes: Recipe[]
): Node[] => {
  if (!selectedItem) return nodes

  const updatedNodes = nodes.map((node) => {
    if (node.id === selectedItem.id.toString()) {
      // Update main item quantity
      return {
        ...node,
        data: {
          ...node.data,
          quantity: targetQuantity
        }
      }
    } else {
      // For all other nodes, calculate quantities based on their recipe
      const recipe = node.data.selectedRecipe as Recipe
      if (recipe) {
        // Find the output item that matches the selected item
        const outputItem = recipe.output?.find(
          (output: { item: number; qty: number | number[] | null }) => output.item === selectedItem.id
        )

        if (outputItem) {
          const outputQty = Array.isArray(outputItem.qty)
            ? outputItem.qty[0] // Use minimum quantity for calculation
            : outputItem.qty || 1

          // Calculate how many times we need to run this recipe
          const recipeRuns = Math.ceil(targetQuantity / outputQty)

          return {
            ...node,
            data: {
              ...node.data,
              quantity: recipeRuns
            }
          }
        }
      }
    }
    return node
  })

  // Now update material nodes based on recipe requirements
  const finalNodes = updatedNodes.map((node) => {
    // Check if this is a material node (has recipe ID in its ID)
    if (node.id.includes('_') && node.id !== selectedItem.id.toString()) {
      const [materialId, recipeId] = node.id.split('_')
      const recipe = recipes.find((r: Recipe) => r.id.toString() === recipeId)

      if (recipe) {
        // Find the material requirement
        const materialReq = recipe.requirements.materials?.find((mat) => mat.id?.toString() === materialId)

        if (materialReq) {
          // Get the quantity needed per recipe run
          const materialQty = materialReq?.qty

          // Only calculate quantities if the material has a specific quantity requirement
          // and is not a resource (resources don't show quantities)
          if (materialQty !== null && materialQty !== undefined && node.data.category !== 'resources') {
            // Find the parent recipe node to get how many times we need to run it
            const parentNode = updatedNodes.find((n) => n.id === selectedItem.id.toString())
            if (parentNode && parentNode.data.selectedRecipe) {
              const parentRecipe = parentNode.data.selectedRecipe as Recipe
              const outputItem = parentRecipe.output?.find(
                (output: { item: number; qty: number | number[] | null }) => output.item === selectedItem.id
              )

              if (outputItem) {
                const outputQty = Array.isArray(outputItem.qty) ? outputItem.qty[0] : outputItem.qty || 1

                const recipeRuns = Math.ceil(targetQuantity / outputQty)
                const totalMaterialQty = recipeRuns * materialQty

                return {
                  ...node,
                  data: {
                    ...node.data,
                    quantity: totalMaterialQty
                  }
                }
              }
            }
          } else {
            // For resources or items without quantity requirements, remove the quantity
            return {
              ...node,
              data: {
                ...node.data,
                quantity: undefined
              }
            }
          }
        }
      }
    }
    return node
  })

  return finalNodes
}
