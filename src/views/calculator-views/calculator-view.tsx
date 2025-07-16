'use client'

import { CustomNode } from '@/components/custom-react-flow-nodes/custom-node'
import { FlowCanvas } from '@/components/flow-canvas'
import { useGameData } from '@/contexts/game-data-context'
import { useEdgeColors } from '@/hooks/use-edge-colors'
import { useLayoutedElements } from '@/hooks/use-layouted-elements'
import type { CalculatorRecipe } from '@/lib/spacetime-db'
import { updateNodeQuantities } from '@/lib/utils/recipe-utils'
import type { Edge, Node } from '@xyflow/react'
import { useEdgesState, useNodesState } from '@xyflow/react'
import { useCallback, useEffect } from 'react'

interface FlowVisualizeViewProps {
  slug: string
  quantity?: number
}

const AUTO_EXPAND_DEPTH = 5

export function FlowVisualizeView({ slug, quantity = 1 }: FlowVisualizeViewProps) {
  const gameData = useGameData()
  const { items, recipes } = gameData

  // Find the item by slug
  const selectedItem = items.find((item) => item.slug === slug)

  // Function to create initial nodes and edges
  const createInitialNodesAndEdges = useCallback(() => {
    if (!selectedItem) return { nodes: [], edges: [] }

    // Find recipes for this item
    const itemRecipes = recipes.filter((r) => r.output.some((output) => output.item === selectedItem.id))

    // Create the main item node
    const itemNode: Node = {
      id: selectedItem.id.toString(),
      type: 'itemNode',
      data: {
        label: selectedItem.name,
        tier: selectedItem.tier,
        rarity: selectedItem.rarity,
        category: selectedItem.category,
        recipes: itemRecipes,
        selectedRecipe: null,
        itemId: selectedItem.id,
        quantity: quantity,
        isDone: false,
        icon_asset_name: selectedItem.icon_asset_name || 'Unknown'
      },
      position: { x: 0, y: 0 }
    }

    let finalNodes: Node[] = [itemNode]
    let finalEdges: Edge[] = []

    // Auto-expand first {n} depths for single-recipe items
    const expandNodeRecipes = (node: Node, depth: number): { nodes: Node[]; edges: Edge[] } => {
      if (depth > AUTO_EXPAND_DEPTH) return { nodes: [], edges: [] }

      const nodeRecipes = node.data.recipes as CalculatorRecipe[] | undefined
      if (!nodeRecipes || nodeRecipes.length !== 1) {
        return { nodes: [node], edges: [] }
      }

      const recipe = nodeRecipes[0]
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          selectedRecipe: recipe
        }
      }

      if (!recipe.requirements.materials || recipe.requirements.materials.length === 0) {
        return { nodes: [updatedNode], edges: [] }
      }

      // Calculate recipe runs
      const outputItem = recipe.output.find((output) => output.item === node.data.itemId)
      const outputQty = outputItem ? (Array.isArray(outputItem.qty) ? outputItem.qty[0] : outputItem.qty) || 1 : 1
      const nodeQuantity = Number(node.data.quantity) || 1
      const recipeRuns = Math.ceil(nodeQuantity / Number(outputQty))

      const materialNodes: Node[] = []
      const materialEdges: Edge[] = []

      recipe.requirements.materials.forEach((material) => {
        const materialId = material.id
        const materialData = items.find((item) => item.id === materialId)
        const materialRecipes = recipes.filter((r) => r.output.some((output) => output.item === material.id))

        let calculatedQuantity = 0
        if (material.qty !== null && material.qty !== undefined && materialData?.category !== 'resources') {
          calculatedQuantity = Number(material.qty) * recipeRuns
        }

        const materialNode: Node = {
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
            isDone: false,
            icon_asset_name: materialData?.icon_asset_name || 'Unknown'
          },
          position: { x: 0, y: 0 }
        }

        materialNodes.push(materialNode)

        materialEdges.push({
          id: `${node.id}-${materialId}`,
          source: materialId,
          target: node.id,
          type: 'bezier',
          animated: false
        })

        // Recursively expand if this material has single recipe and we haven't hit depth limit
        if (depth < AUTO_EXPAND_DEPTH) {
          const childExpansion = expandNodeRecipes(materialNode, depth + 1)
          materialNodes.push(...childExpansion.nodes)
          materialEdges.push(...childExpansion.edges)
        }
      })

      return {
        nodes: [updatedNode, ...materialNodes],
        edges: materialEdges
      }
    }

    // Start expansion from the main item
    const expansion = expandNodeRecipes(itemNode, 1)
    finalNodes = expansion.nodes
    finalEdges = expansion.edges

    return { nodes: finalNodes, edges: finalEdges }
  }, [selectedItem, quantity, recipes, items])

  // Calculate initial nodes and edges directly
  const { nodes: initialCalculatedNodes, edges: initialCalculatedEdges } = createInitialNodesAndEdges()

  const [nodes, setNodes, onNodesChange] = useNodesState(initialCalculatedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialCalculatedEdges)
  const { getLayoutedElements } = useLayoutedElements()
  useEdgeColors(nodes, edges, setEdges)

  const updateNodeQuantitiesCallback = useCallback(
    (targetQuantity: number) => {
      if (!selectedItem) return

      setNodes((currentNodes) => {
        return updateNodeQuantities(currentNodes, selectedItem, targetQuantity)
      })
    },
    [selectedItem, setNodes]
  )

  // Apply layout whenever nodes or edges change (but don't fit view)
  useEffect(() => {
    if (nodes.length > 1 || edges.length > 0) {
      setTimeout(() => getLayoutedElements(false), 0)
    }
  }, [nodes.length, edges.length, getLayoutedElements])

  // Update node quantities when quantity changes
  useEffect(() => {
    if (selectedItem && nodes.length > 0) {
      updateNodeQuantitiesCallback(quantity)
    }
  }, [quantity, selectedItem, nodes.length, updateNodeQuantitiesCallback])

  return (
    <div className="h-full">
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={{
          itemNode: CustomNode,
          materialNode: CustomNode
        }}
        className="h-full"
      />
    </div>
  )
}
