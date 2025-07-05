'use client'

import { Container } from '@/components/container'
import { ItemNode, MaterialNode } from '@/components/recipe-nodes'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Recipe } from '@/src/lib/types'
import Dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

// Utility function to resolve recipe name placeholders
const resolveRecipeName = (recipe: Recipe, allItems: typeof items): string => {
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

import cargo from '@/src/data/cargo.json'
import items from '@/src/data/items.json'
import recipes from '@/src/data/recipes.json'
import resources from '@/src/data/resources.json'

// All available items in the database
const allItems: Array<{
  id: number
  name: string
  slug: string
  tier: number
  rarity: string
  category: string
  description: string
}> = [...items, ...cargo, ...resources]

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const getLayoutedElements = useCallback(
    (shouldFitView = false) => {
      const nodes = getNodes()
      const edges = getEdges()

      const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
      g.setGraph({
        rankdir: 'TB',
        ranker: 'network-simplex',
        align: 'UL',
        nodesep: 40,
        ranksep: 80
      })

      edges.forEach((edge) => g.setEdge(edge.source, edge.target))
      nodes.forEach((node) =>
        g.setNode(node.id, {
          width: node.measured?.width ?? 320,
          height: node.measured?.height ?? 120
        })
      )

      Dagre.layout(g)

      const layoutedNodes = nodes.map((node) => {
        const position = g.node(node.id)
        return {
          ...node,
          position: {
            x: position.x - (node.measured?.width ?? 0) / 2,
            y: position.y - (node.measured?.height ?? 0) / 2
          }
        }
      })

      setNodes(layoutedNodes)

      // Only fit view on initial load or when explicitly requested
      if (shouldFitView || isInitialLoad) {
        fitView()
        setIsInitialLoad(false)
      }
    },
    [getNodes, getEdges, setNodes, fitView, isInitialLoad]
  )

  return { getLayoutedElements }
}

// Add these helper functions near the top (after imports):
const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    case 'uncommon':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'rare':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'epic':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'legendary':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}
const getTierColor = (tier: number) => {
  switch (tier) {
    case 1:
      return 'bg-gray-100 text-gray-800 border-gray-300'
    case 2:
      return 'bg-green-100 text-green-800 border-green-300'
    case 3:
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 4:
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 5:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

function HomeFlow() {
  const t = useTranslations()

  // Convert items to combobox options - memoized for performance
  const itemOptions = React.useMemo(
    () =>
      allItems.map((item) => ({
        value: item.id.toString(),
        label: item.name,
        keywords: `${item.name} ${item.slug} ${item.category}`
      })),
    []
  )

  const [selectedItem, setSelectedItem] = useState<(typeof allItems)[0] | null>(null)
  const [desiredQuantity, setDesiredQuantity] = useState(1)
  const [minQuantity, setMinQuantity] = useState(1)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { getLayoutedElements } = useLayoutedElements()

  // Track previous node states to prevent unnecessary edge updates
  const prevNodeStates = useRef<Map<string, boolean>>(new Map())

  // Update edge colors when nodes change
  useEffect(() => {
    if (edges.length > 0) {
      // Check if any node's done state has actually changed
      let hasChanges = false
      const currentNodeStates = new Map<string, boolean>()

      nodes.forEach((node) => {
        const isDone = Boolean(node.data?.isDone)
        const prevIsDone = prevNodeStates.current.get(node.id) || false
        currentNodeStates.set(node.id, isDone)

        if (isDone !== prevIsDone) {
          hasChanges = true
        }
      })

      // Only update edges if there are actual changes
      if (hasChanges) {
        const updatedEdges = edges.map((edge) => {
          const targetNode = nodes.find((node) => node.id === edge.target)
          const isTargetDone = Boolean(targetNode?.data?.isDone)

          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: isTargetDone ? '#22c55e' : '#64748b', // Green if done, gray if not
              strokeWidth: isTargetDone ? 3 : 2
            }
          }
        })
        setEdges(updatedEdges)

        // Update the ref with current states
        prevNodeStates.current = currentNodeStates
      }
    }
  }, [nodes, edges, setEdges])

  // Apply layout whenever nodes or edges change (but don't fit view)
  useEffect(() => {
    if (nodes.length > 1 || edges.length > 0) {
      setTimeout(() => getLayoutedElements(false), 0) // Don't fit view on recipe selections
    }
  }, [nodes.length, edges.length, getLayoutedElements])

  const updateNodeQuantities = useCallback(
    (targetQuantity: number) => {
      if (!selectedItem) return

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

      setNodes(finalNodes)
    },
    [nodes, selectedItem, setNodes]
  )

  const handleItemSelect = useCallback(
    (itemId: string) => {
      const item = allItems.find((item) => item.id.toString() === itemId)
      if (!item) return

      // Find recipes for this specific item
      const itemRecipes = recipes.filter((recipe) => recipe.output.some((output) => output.item === item.id))

      // Calculate default quantity based on recipe output
      let defaultQuantity = 1
      let minQty = 1
      if (itemRecipes.length > 0) {
        // Use the first recipe's output quantity as default and minimum
        const firstRecipe = itemRecipes[0]
        const outputItem = firstRecipe.output.find((output) => output.item === item.id)
        if (outputItem && outputItem.qty) {
          defaultQuantity = Array.isArray(outputItem.qty) ? outputItem.qty[0] : outputItem.qty
          minQty = defaultQuantity // Minimum quantity is the same as the recipe output
        }
      }

      setSelectedItem(item)
      setDesiredQuantity(defaultQuantity)
      setMinQuantity(minQty)

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
          quantity: defaultQuantity,
          isDone: false // Initialize as not done
        },
        position: { x: 0, y: 0 } // Will be positioned by dagre
      }

      // Set the node and apply layout
      setNodes([itemNode])
      setEdges([])
      setTimeout(() => getLayoutedElements(true), 0) // Fit view on initial item selection
    },
    [setNodes, setEdges, getLayoutedElements]
  )

  return (
    <div className="bg-background h-[calc(100vh-3.5rem)] overflow-hidden">
      <Container className="h-full py-8">
        {/* Main Content Grid */}
        <div className="grid h-full grid-cols-12 gap-6">
          {/* Left Column - Title, Search and Info Section (3 columns) */}
          <div className="col-span-3 flex flex-col space-y-4 overflow-hidden">
            {/* Title and Subtitle */}
            <div className="flex-shrink-0 text-left">
              <h1 className="text-foreground mb-2 text-3xl font-bold">{t('header.title')}</h1>
              <p className="text-muted-foreground text-lg">{t('header.subtitle')}</p>
            </div>

            {/* Search Card */}
            <Card className="flex-shrink-0">
              <CardHeader>
                <CardTitle>{t('calculator.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Combobox
                  options={itemOptions}
                  value={selectedItem?.id.toString() || ''}
                  onValueChange={handleItemSelect}
                  placeholder={t('calculator.searchPlaceholder')}
                  searchPlaceholder={t('calculator.searchItems')}
                  emptyText={t('calculator.noItemsFound')}
                />
              </CardContent>
            </Card>

            {/* Item Information Card */}
            {selectedItem && (
              <Card className="flex flex-1 flex-col overflow-hidden">
                <CardHeader className="flex-shrink-0">
                  <CardTitle>{selectedItem.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4 overflow-hidden">
                  {/* Info Section */}
                  <div className="flex-shrink-0">
                    <h3 className="text-muted-foreground mb-2 text-sm font-semibold">{t('common.info')}</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">{t('common.description')}:</span>
                        <p className="text-muted-foreground mt-1">
                          {selectedItem.description || 'No description available'}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className={`text-xs ${getTierColor(selectedItem.tier)}`}>
                          Tier {selectedItem.tier || 'Unknown'}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getRarityColor(selectedItem.rarity)}`}>
                          {selectedItem.rarity || 'Unknown'}
                        </Badge>
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-700">
                          {selectedItem.category || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input Section */}
                  <div className="flex-shrink-0">
                    <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
                      {t('calculator.craftingQuantity')}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={desiredQuantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newQuantity = parseInt(e.target.value) || 1
                            setDesiredQuantity(newQuantity)
                            if (nodes.length > 0 && selectedItem) {
                              updateNodeQuantities(newQuantity)
                            }
                          }}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const newQuantity = parseInt(e.target.value) || 1
                            if (newQuantity < minQuantity) {
                              toast.warning(t('toast.quantityAdjusted', { minQuantity }), {
                                description: t('toast.quantityAdjustedDescription')
                              })
                              setDesiredQuantity(minQuantity)
                              if (nodes.length > 0 && selectedItem) {
                                updateNodeQuantities(minQuantity)
                              }
                            }
                          }}
                          className="w-20"
                        />
                        <span className="text-muted-foreground text-sm">{t('calculator.itemsToCraft')}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Minimum: {minQuantity} (one complete recipe execution)
                      </p>
                    </div>
                  </div>

                  {/* Usage Section */}
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <h3 className="text-muted-foreground mb-2 flex-shrink-0 text-sm font-semibold">
                      {t('common.usage')}
                    </h3>
                    <ScrollArea className="flex-1">
                      <div className="space-y-2 pr-4">
                        {recipes.filter((recipe) =>
                          recipe.requirements.materials?.some(
                            (material) => material.id?.toString() === selectedItem?.id.toString()
                          )
                        ).length > 0 ? (
                          recipes
                            .filter((recipe) =>
                              recipe.requirements.materials?.some(
                                (material) => material.id?.toString() === selectedItem?.id.toString()
                              )
                            )
                            .map((recipe, index) => (
                              <div key={index} className="bg-muted rounded p-2 text-sm">
                                <div className="font-medium">{resolveRecipeName(recipe, allItems)}</div>
                                <div className="text-muted-foreground text-xs">
                                  {t('calculator.produces')}:{' '}
                                  {recipe.output.map((output, i) => {
                                    const outputItem = allItems.find((item) => item.id === output.item)
                                    return (
                                      <span key={i}>
                                        {output.qty
                                          ? Array.isArray(output.qty)
                                            ? `${output.qty[0]}-${output.qty[1]}`
                                            : output.qty
                                          : '?'}
                                        x {outputItem?.name || `Item ${output.item}`}
                                        {i < recipe.output.length - 1 ? ', ' : ''}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-muted-foreground text-sm">{t('calculator.noRecipes')}</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - React Flow Canvas (9 columns) */}
          <div className="col-span-9">
            <Card className="h-full">
              <CardContent className="h-full p-0">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={{
                    itemNode: ItemNode,
                    materialNode: MaterialNode
                  }}
                  className="h-full"
                >
                  {/* <MiniMap nodeStrokeWidth={3} position="top-right" /> */}
                  <Controls className="bg-background border-border border" />
                  <Background />
                </ReactFlow>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <HomeFlow />
    </ReactFlowProvider>
  )
}
