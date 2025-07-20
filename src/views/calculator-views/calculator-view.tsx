'use client'

import { CustomNode } from '@/components/custom-react-flow-nodes/custom-node'
import { FlowCanvas } from '@/components/flow-canvas'
import { DEFAULT_ICON_PATH } from '@/constants/assets'
import { useGameData } from '@/contexts/game-data-context'
import { useCalculatorSaves } from '@/hooks/use-calculator-saves'
import { useEdgeColors } from '@/hooks/use-edge-colors'
import { useLayoutedElements } from '@/hooks/use-layouted-elements'
import { calculateQuantitiesFromEdges } from '@/lib/spacetime-db/modules/recipes/recipe-utils'
import type { CalculatorRecipe } from '@/lib/spacetime-db/shared/dtos/calculator-dtos'
import type { Edge, Node } from '@xyflow/react'
import { useEdgesState, useNodesState } from '@xyflow/react'
import { useCallback, useEffect } from 'react'

interface FlowVisualizeViewProps {
  slug: string
  quantity?: number
}

const AUTO_EXPAND_DEPTH = 4

export function FlowVisualizeView({ slug, quantity = 1 }: FlowVisualizeViewProps) {
  const gameData = useGameData()
  const { items, recipes } = gameData
  const { loadCalculator } = useCalculatorSaves()

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
        icon_asset_name: selectedItem.icon_asset_name || DEFAULT_ICON_PATH
      },
      position: { x: 0, y: 0 }
    }

    // Iterative expansion using a queue-based approach
    const nodesToProcess: Array<{ node: Node; depth: number }> = [{ node: itemNode, depth: 0 }]
    const allNodes: Node[] = []
    const allEdges: Edge[] = []
    const processedNodeIds = new Set<string>()

    while (nodesToProcess.length > 0) {
      const { node, depth } = nodesToProcess.shift()!

      // Skip if we've already processed this node or hit depth limit
      if (processedNodeIds.has(node.id) || depth >= AUTO_EXPAND_DEPTH) {
        if (!processedNodeIds.has(node.id)) {
          allNodes.push(node)
          processedNodeIds.add(node.id)
        }
        continue
      }

      const nodeRecipes = node.data.recipes as CalculatorRecipe[] | undefined

      // If no recipes, just add the node without expansion
      if (!nodeRecipes || nodeRecipes.length === 0) {
        allNodes.push(node)
        processedNodeIds.add(node.id)
        continue
      }

      // Filter out recipes that would create circular dependencies
      const nonCircularRecipes = nodeRecipes.filter((recipe) => {
        if (!recipe.requirements.materials) return true

        // Check if any material in this recipe would create a circular dependency
        return !recipe.requirements.materials.some((material) => {
          const materialId = material.id.toString()
          const currentNodeId = node.id

          // Check if there's already an edge from currentNodeId to materialId
          // If so, creating materialId -> currentNodeId would create a circle
          return allEdges.some((edge) => edge.source === currentNodeId && edge.target === materialId)
        })
      })

      // Use first non-circular recipe, or fallback to first recipe if all are circular
      const recipe = nonCircularRecipes.length > 0 ? nonCircularRecipes[0] : nodeRecipes[0]
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          selectedRecipe: recipe
        }
      }

      allNodes.push(updatedNode)
      processedNodeIds.add(node.id)

      // If recipe has no materials, continue to next node
      if (!recipe.requirements.materials || recipe.requirements.materials.length === 0) {
        continue
      }

      // Calculate recipe runs
      const outputItem = recipe.output.find((output) => output.item === node.data.itemId)
      const outputQty = outputItem ? (Array.isArray(outputItem.qty) ? outputItem.qty[0] : outputItem.qty) || 1 : 1
      const nodeQuantity = Number(node.data.quantity) || 1
      const recipeRuns = Math.ceil(nodeQuantity / Number(outputQty))

      // Process each material
      recipe.requirements.materials.forEach((material) => {
        const materialId = material.id
        const materialData = items.find((item) => item.id === materialId)
        const materialRecipes = recipes.filter((r) => r.output.some((output) => output.item === materialId))

        let calculatedQuantity = 0
        if (material.qty !== null && material.qty !== undefined && materialData?.category !== 'resources') {
          calculatedQuantity = Number(material.qty) * recipeRuns
        }

        const materialNode: Node = {
          id: materialId,
          type: materialRecipes.length > 0 ? 'itemNode' : 'materialNode',
          data: {
            label: materialData?.name || 'Not in Compendium',
            tier: materialData?.tier || 1,
            rarity: materialData?.rarity || 'common',
            category: materialData?.category || 'unknown',
            quantity: calculatedQuantity,
            recipes: materialRecipes,
            selectedRecipe: null,
            itemId: materialId,
            isDone: false,
            icon_asset_name: materialData?.icon_asset_name || DEFAULT_ICON_PATH
          },
          position: { x: 0, y: 0 }
        }

        // Add edge from material to parent
        allEdges.push({
          id: `${node.id}-${materialId}`,
          source: materialId,
          target: node.id,
          animated: false
        })

        // Add material node to processing queue for next depth level
        nodesToProcess.push({ node: materialNode, depth: depth + 1 })
      })
    }

    // Deduplicate nodes and edges
    const seenNodeIds = new Set<string>()
    const uniqueNodes = allNodes.filter((node) => {
      if (seenNodeIds.has(node.id)) return false
      seenNodeIds.add(node.id)
      return true
    })

    const seenEdgeIds = new Set<string>()
    const uniqueEdges = allEdges.filter((edge) => {
      if (seenEdgeIds.has(edge.id)) return false
      seenEdgeIds.add(edge.id)
      return true
    })

    return { nodes: uniqueNodes, edges: uniqueEdges }
  }, [selectedItem, quantity, recipes, items])

  // Always start with calculated nodes, then load saved state if available
  const { nodes: calculatedNodes, edges: calculatedEdges } = createInitialNodesAndEdges()

  const [nodes, setNodes, onNodesChange] = useNodesState(calculatedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(calculatedEdges)

  // Check if there's a saved state for this item and load it when available
  const savedState = loadCalculator(slug)

  // Load saved state when it becomes available
  useEffect(() => {
    if (savedState && savedState.nodes.length > 0) {
      // When loading from saved state, update quantities if needed
      if (selectedItem && savedState.quantity !== quantity) {
        const updatedNodes = calculateQuantitiesFromEdges(savedState.nodes, savedState.edges, selectedItem, quantity)
        setNodes(updatedNodes)
      } else {
        setNodes(savedState.nodes)
      }
      setEdges(savedState.edges)
    }
  }, [savedState, selectedItem, quantity, setNodes, setEdges])
  const { getLayoutedElements } = useLayoutedElements()

  useEdgeColors(nodes, edges, setEdges)

  // Listen for quantity recalculation events from custom nodes
  useEffect(() => {
    const handleRecalculateQuantities = () => {
      if (!selectedItem) return

      setNodes((currentNodes) => {
        return calculateQuantitiesFromEdges(currentNodes, edges, selectedItem, quantity)
      })
    }

    window.addEventListener('recalculateQuantities', handleRecalculateQuantities)
    return () => {
      window.removeEventListener('recalculateQuantities', handleRecalculateQuantities)
    }
  }, [selectedItem, edges, quantity, setNodes])

  // Apply layout whenever nodes or edges change (but don't fit view)
  useEffect(() => {
    if (nodes.length > 1 || edges.length > 0) {
      setTimeout(() => getLayoutedElements(false), 0)
    }
  }, [nodes.length, edges.length, getLayoutedElements])

  // Update node quantities when quantity changes
  useEffect(() => {
    if (selectedItem && nodes.length > 0) {
      setNodes((currentNodes) => {
        return calculateQuantitiesFromEdges(currentNodes, edges, selectedItem, quantity)
      })
    }
  }, [quantity, selectedItem, nodes.length, edges, setNodes])

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
