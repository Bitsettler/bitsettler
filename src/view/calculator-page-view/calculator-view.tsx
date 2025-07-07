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
  }>
  recipes: Recipe[]
}

interface FlowVisualizeViewProps {
  gameData: GameData
  initialItemId?: string
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

      // Create only the main item node initially
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
          isDone: false
        },
        position: { x: 0, y: 0 }
      }

      // Set the node and apply layout
      setNodes([itemNode])
      setEdges([])
      setTimeout(() => getLayoutedElements(true), 0)
    },
    [handleItemSelect, setNodes, setEdges, getLayoutedElements, initialQuantity]
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
