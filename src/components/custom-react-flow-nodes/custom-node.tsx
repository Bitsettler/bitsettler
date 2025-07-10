'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getRarityColor, getTierColor } from '@/lib/utils/item-utils'
import { resolveRecipeName } from '@/lib/utils/recipe-utils'
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react'
import Image from 'next/image'
import { memo, useCallback } from 'react'

// Import data
import cargo from '@/data/cargo.json'
import extractionRecipes from '@/data/extraction-recipes.json'
import items from '@/data/items.json'
import craftingRecipes from '@/data/recipes.json'
import resources from '@/data/resources.json'
import { ItemData, Recipe } from './types'

// Merge crafting and extraction recipes
const recipes = [...craftingRecipes, ...extractionRecipes] as Recipe[]

export const CustomNode = memo(({ id, data }: NodeProps & { data: ItemData }) => {
  const itemData = data
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow()

  const handleToggleDone = useCallback(() => {
    const currentNodes = getNodes()
    const currentEdges = getEdges()
    const currentNode = currentNodes.find((node) => node.id === id)

    if (!currentNode) return

    const newIsDone = !currentNode.data.isDone

    // Function to recursively find and mark all child nodes as done
    const markChildrenAsDone = (nodeId: string, nodesToUpdate: Set<string>) => {
      // Find all edges where this node is the target (meaning find all materials that feed into this node)
      const childEdges = currentEdges.filter((edge) => edge.target === nodeId)

      childEdges.forEach((edge) => {
        const childNodeId = edge.source
        nodesToUpdate.add(childNodeId)
        // Recursively mark children of children as done
        markChildrenAsDone(childNodeId, nodesToUpdate)
      })
    }

    // Function to recursively find and mark all parent nodes as not done
    const markParentsAsNotDone = (nodeId: string, nodesToUpdate: Set<string>) => {
      // Find all edges where this node is the source (meaning find all items that depend on this node)
      const parentEdges = currentEdges.filter((edge) => edge.source === nodeId)

      parentEdges.forEach((edge) => {
        const parentNodeId = edge.target
        nodesToUpdate.add(parentNodeId)
        // Recursively mark parents of parents as not done
        markParentsAsNotDone(parentNodeId, nodesToUpdate)
      })
    }

    // Collect all nodes that need to be updated
    const nodesToUpdate = new Set<string>([id])

    if (newIsDone) {
      // When marking as done, cascade to all children (dependencies)
      markChildrenAsDone(id, nodesToUpdate)
    } else {
      // When marking as not done, cascade to all parents (dependents)
      markParentsAsNotDone(id, nodesToUpdate)
    }

    // Update all affected nodes
    const updatedNodes = currentNodes.map((node) => {
      if (nodesToUpdate.has(node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            isDone: newIsDone
          }
        }
      }
      return node
    })

    setNodes(updatedNodes)
  }, [id, getNodes, getEdges, setNodes])

  const handleRecipeSelect = useCallback(
    (recipeId: string) => {
      // Use imported data
      const allItems = [...items, ...cargo, ...resources]

      const recipe = recipes.find((r) => r.id.toString() === recipeId)
      if (!recipe) return

      // Update the current node with selected recipe
      const updatedNodes = getNodes().map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              selectedRecipe: recipe
            }
          }
        }
        return node
      })

      // Remove ALL existing material nodes and edges that were created FROM this parent node
      // We need to find all nodes that are children of the current node (id)
      const currentEdges = getEdges()
      const childNodeIds = new Set<string>()

      // Find all nodes that are directly connected as children (targets of edges from current node)
      currentEdges.forEach((edge) => {
        if (edge.target === id) {
          childNodeIds.add(edge.source)
        }
      })

      // Recursively find all descendant nodes
      const findAllDescendants = (nodeIds: Set<string>): Set<string> => {
        const allDescendants = new Set(nodeIds)
        let foundNew = true

        while (foundNew) {
          foundNew = false
          currentEdges.forEach((edge) => {
            if (allDescendants.has(edge.target) && !allDescendants.has(edge.source)) {
              allDescendants.add(edge.source)
              foundNew = true
            }
          })
        }

        return allDescendants
      }

      const allChildNodeIds = findAllDescendants(childNodeIds)

      // Remove all child nodes (but keep the current parent node)
      const filteredNodes = updatedNodes.filter((node) => {
        if (node.id === id) return true // Keep the current node
        return !allChildNodeIds.has(node.id) // Remove all child nodes
      })

      // Remove all edges connected to the removed child nodes
      const filteredEdges = currentEdges.filter((edge) => {
        // Keep edges that don't involve any of the removed child nodes
        return !allChildNodeIds.has(edge.source) && !allChildNodeIds.has(edge.target)
      })

      // Only create material nodes if the recipe has materials
      if (recipe.requirements.materials && recipe.requirements.materials.length > 0) {
        // Get the current node's quantity to calculate child quantities
        const currentNode = filteredNodes.find((node) => node.id === id)
        const parentQuantity = (currentNode?.data?.quantity as number) || 1
        const parentIsDone = currentNode?.data?.isDone || false

        // Calculate how many times we need to run this recipe
        const outputItem = recipe.output.find((output) => output.item === currentNode?.data?.itemId)
        const outputQty = outputItem ? (Array.isArray(outputItem.qty) ? outputItem.qty[0] : outputItem.qty) || 1 : 1
        const recipeRuns = Math.ceil(parentQuantity / outputQty)

        // Create material nodes with quantity aggregation
        const materialNodes = recipe.requirements.materials.map((material: { id: string; qty: number | null }) => {
          const materialId = material.id
          const materialData = allItems.find((item) => item.id === materialId)

          // Check if this material has recipes (for recursive expansion)
          const materialRecipes = recipes.filter((r) => r.output.some((output) => output.item === material.id))

          // Calculate the total quantity needed for this material
          let calculatedQuantity: number = 0
          if (material.qty !== null && material.qty !== undefined && materialData?.category !== 'resources') {
            calculatedQuantity = (material.qty as number) * recipeRuns
          }

          // Check if a node for this material already exists
          const existingNode = filteredNodes.find((node) => node.id === material.id)

          if (existingNode) {
            // Node exists, update its quantity by adding the new requirement
            const existingQuantity = (existingNode.data as unknown as { quantity?: number }).quantity || 0
            const newTotalQuantity = existingQuantity + calculatedQuantity

            return {
              ...existingNode,
              data: {
                ...existingNode.data,
                quantity: newTotalQuantity,
                // If parent is done, mark existing node as done too
                isDone: parentIsDone || existingNode.data.isDone,
                // Ensure icon_asset_name is set if it's missing
                icon_asset_name: existingNode.data.icon_asset_name || 'GeneratedIcons/Items/Unknown'
              }
            }
          } else {
            // Create new node
            return {
              id: material.id,
              type: materialRecipes.length > 0 ? 'itemNode' : 'materialNode',
              data: {
                label: materialData?.name || `Item ${material.id}`,
                tier: materialData?.tier || 1,
                rarity: materialData?.rarity || 'common',
                category: materialData?.category || 'unknown',
                quantity: calculatedQuantity,
                recipes: materialRecipes,
                selectedRecipe: null,
                itemId: material.id,
                isDone: parentIsDone, // Inherit parent's done status
                icon_asset_name: materialData?.icon_asset_name || 'GeneratedIcons/Items/Unknown'
              },
              position: { x: 0, y: 0 }
            }
          }
        })

        // Create edges connecting main item to materials
        const materialEdges = recipe.requirements.materials.map((material) => {
          const materialId = material.id
          return {
            id: `${id}-${materialId}`,
            source: `${materialId}`,
            target: id,
            type: 'bezier',
            animated: false
          }
        })

        setNodes([...filteredNodes, ...materialNodes])
        setEdges([...filteredEdges, ...materialEdges])
      } else {
        // For gathering recipes without materials, just update the node
        setNodes([...filteredNodes])
        setEdges([...filteredEdges])
      }
    },
    [id, getNodes, getEdges, setNodes, setEdges]
  )

  const handleMouseEnter = useCallback(() => {
    const updatedNodes = getNodes().map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            isHovered: true
          }
        }
      }
      return node
    })
    setNodes(updatedNodes)
  }, [id, getNodes, setNodes])

  const handleMouseLeave = useCallback(() => {
    const updatedNodes = getNodes().map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            isHovered: false
          }
        }
      }
      return node
    })
    setNodes(updatedNodes)
  }, [id, getNodes, setNodes])

  return (
    <Card
      className={`relative w-fit min-w-64 border-2 shadow-lg ${
        itemData.isDone
          ? 'border-green-500 bg-green-50/30'
          : itemData.isHovered
            ? 'border-blue-500 shadow-blue-500/50'
            : 'border-primary/20'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Debug mode: Show item ID and recipe ID in development */}
      {process.env.NEXT_PUBLIC_DEBUG == 'true' && (
        <div className="absolute -top-2 -left-2 z-10 flex flex-col gap-0.5">
          {itemData.itemId && (
            <div className="rounded bg-red-500 px-1 py-0.5 font-mono text-xs text-white">Item: {itemData.itemId}</div>
          )}
          {itemData.selectedRecipe && (
            <div className="rounded bg-blue-500 px-1 py-0.5 font-mono text-xs text-white">
              Recipe: {itemData.selectedRecipe.id}
            </div>
          )}
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {itemData.category !== 'resource' && (
            <Checkbox
              checked={itemData.isDone}
              onCheckedChange={handleToggleDone}
              className="data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500"
            />
          )}
          <CardTitle className={`text-sm font-semibold ${itemData.isDone ? 'text-green-700 line-through' : ''}`}>
            {itemData.label}
          </CardTitle>
        </div>
        {itemData.quantity && (
          <div className="mt-1 flex items-center gap-2">
            <Image
              src={`/assets/${itemData.icon_asset_name || 'GeneratedIcons/Items/Unknown'}.webp`}
              alt={itemData.label}
              width={48}
              height={48}
              className="rounded"
            />
            {itemData.category !== 'resource' && (
              <Badge variant="secondary" className="text-xs">
                Qty: {Math.round(itemData.quantity)}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-2 flex flex-wrap gap-1">
          {itemData.tier !== -1 && (
            <Badge variant="outline" className={`text-xs ${getTierColor(itemData.tier)}`}>
              Tier {itemData.tier}
            </Badge>
          )}
          <Badge variant="outline" className={`text-xs ${getRarityColor(itemData.rarity || 'common')}`}>
            {itemData.rarity || 'Common'}
          </Badge>
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-700">
            {itemData.category}
          </Badge>
        </div>

        {itemData.category !== 'resource' && itemData.recipes && itemData.recipes.length > 0 && (
          <div className="mt-2">
            {itemData.recipes.length === 1 ? (
              <div className="mb-1 text-xs font-medium">Recipe:</div>
            ) : (
              <div className="mb-1 text-xs font-medium">Select Recipe ({itemData.recipes.length} available):</div>
            )}
            <Select value={itemData.selectedRecipe?.id?.toString() || ''} onValueChange={handleRecipeSelect}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choose recipe..." />
              </SelectTrigger>
              <SelectContent className="max-w-80">
                {itemData.recipes.map((recipe: Recipe) => {
                  const allItems = [...items, ...cargo, ...resources]
                  return (
                    <SelectItem key={recipe.id} value={recipe.id.toString()}>
                      <div className="truncate">{resolveRecipeName(recipe, allItems) || `Recipe #${recipe.id}`}</div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {itemData.category !== 'resource' && (!itemData.recipes || itemData.recipes.length === 0) && (
          <div className="text-muted-foreground mt-2 text-xs">No recipes available for this item</div>
        )}

        {itemData.category !== 'resource' && itemData.selectedRecipe && (
          <div className="bg-muted/50 mt-2 rounded p-2 text-xs">
            <div className="mb-1 font-medium">Recipe requirement:</div>
            <div>Profession: {itemData.selectedRecipe.requirements.professions}</div>
            <div>Building: {itemData.selectedRecipe.requirements.building}</div>
            <div>Tool: {itemData.selectedRecipe.requirements.tool}</div>
          </div>
        )}
      </CardContent>

      <Handle type="source" position={Position.Right} className="h-3 w-3" />
      <Handle type="target" position={Position.Left} className="h-3 w-3" />
    </Card>
  )
})

CustomNode.displayName = 'CustomNode'
