'use client'

import { CustomNode } from '@/components/custom-react-flow-nodes/custom-node'
import { FlowCanvas } from '@/components/flow-canvas'
import { useEdgeColors } from '@/hooks/use-edge-colors'
import { useItemSelection } from '@/hooks/use-item-selection'
import { useLayoutedElements } from '@/hooks/use-layouted-elements'
import { Recipe } from '@/lib/types'
import { updateNodeQuantities } from '@/lib/utils/recipe-utils'
import type { Edge, Node } from '@xyflow/react'
import { ReactFlowProvider, useEdgesState, useNodesState } from '@xyflow/react'
import { useCallback, useEffect } from 'react'

// Define the data structure that will be passed as props
interface GameData {
  items: Array<{
    id: string
    name: string
    slug: string
    tier: number
    rarity: string
    category: string
    description: string
    icon_asset_name: string
  }>
  recipes: Recipe[]
}

interface FlowVisualizeViewProps {
  gameData: GameData
  initialItemId: string
  initialQuantity?: number
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

function View({ gameData, initialItemId, initialQuantity = 1 }: FlowVisualizeViewProps) {
  const { items, recipes } = gameData

  // Use custom hooks
  const { selectedItem, handleItemSelect } = useItemSelection({
    items,
    recipes,
    initialQuantity
  })

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
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

  const handleItemSelectWithNodes = useCallback(
    (itemId: string) => {
      const result = handleItemSelect(itemId)

      if (!result) return

      const { item, itemRecipes } = result

      // Create the main item node initially
      const itemNode: Node = {
        id: item.id.toString(),
        type: 'itemNode',
        data: {
          label: item.name,
          tier: item.tier,
          rarity: item.rarity,
          category: item.category,
          recipes: itemRecipes,
          selectedRecipe: null,
          itemId: item.id,
          quantity: initialQuantity,
          isDone: false,
          icon_asset_name: item.icon_asset_name || 'Unknown'
        },
        position: { x: 0, y: 0 }
      }

      let finalNodes: Node[] = [itemNode]
      let finalEdges: Edge[] = []

      // Auto-expand first 2 depths for single-recipe items
      const expandNodeRecipes = (node: Node, depth: number): { nodes: Node[]; edges: Edge[] } => {
        if (depth > 2) return { nodes: [], edges: [] }

        const nodeRecipes = node.data.recipes as Recipe[] | undefined
        if (!nodeRecipes || nodeRecipes.length !== 1) {
          // If no recipes or multiple recipes, return the node without expansion
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
          if (depth < 2) {
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

      // Set the nodes and edges, then apply layout
      setNodes(finalNodes)
      setEdges(finalEdges)
      setTimeout(() => getLayoutedElements(true), 0)
    },
    [handleItemSelect, setNodes, setEdges, getLayoutedElements, initialQuantity, items, recipes]
  )

  // Apply layout whenever nodes or edges change (but don't fit view)
  useEffect(() => {
    if (nodes.length > 1 || edges.length > 0) {
      setTimeout(() => getLayoutedElements(false), 0)
    }
  }, [nodes.length, edges.length, getLayoutedElements])

  // Initialize with the initial item if provided
  useEffect(() => {
    if (initialItemId && !selectedItem) {
      handleItemSelectWithNodes(initialItemId)
    }
  }, [initialItemId, selectedItem, handleItemSelectWithNodes])

  // Update node quantities when initialQuantity changes
  useEffect(() => {
    if (selectedItem && nodes.length > 0) {
      updateNodeQuantitiesCallback(initialQuantity)
    }
  }, [initialQuantity, selectedItem, nodes.length, updateNodeQuantitiesCallback])

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

export function FlowVisualizeView({ gameData, initialItemId, initialQuantity }: FlowVisualizeViewProps) {
  return (
    <ReactFlowProvider>
      <View gameData={gameData} initialItemId={initialItemId} initialQuantity={initialQuantity} />
    </ReactFlowProvider>
  )
}
