'use client'

import { Container } from '@/components/container'
import { ItemNode } from '@/components/custom-react-flow-nodes/item-node'
import { MaterialNode } from '@/components/custom-react-flow-nodes/material-node'
import { FlowCanvas } from '@/components/flow-canvas'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEdgeColors } from '@/hooks/use-edge-colors'
import { useItemSelection } from '@/hooks/use-item-selection'
import { useLayoutedElements } from '@/hooks/use-layouted-elements'
import { Recipe } from '@/lib/types'
import { getRarityColor, getTierColor } from '@/lib/utils/item-utils'
import { resolveRecipeName, updateNodeQuantities } from '@/lib/utils/recipe-utils'
import type { Edge, Node } from '@xyflow/react'
import { ReactFlowProvider, useEdgesState, useNodesState } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

// Define the data structure that will be passed as props
interface GameData {
  items: Array<{
    id: number
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
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

function View({ gameData }: FlowVisualizeViewProps) {
  const t = useTranslations()
  const { items, recipes } = gameData

  // Use custom hooks
  const { selectedItem, desiredQuantity, minQuantity, handleItemSelect, updateQuantity } = useItemSelection({
    items,
    recipes
  })

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { getLayoutedElements } = useLayoutedElements()
  useEdgeColors(nodes, edges, setEdges)

  // Convert items to combobox options - memoized for performance
  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id.toString(),
        label: item.name,
        keywords: `${item.name} ${item.slug} ${item.category}`
      })),
    [items]
  )

  // Apply layout whenever nodes or edges change (but don't fit view)
  useEffect(() => {
    if (nodes.length > 1 || edges.length > 0) {
      setTimeout(() => getLayoutedElements(false), 0) // Don't fit view on recipe selections
    }
  }, [nodes.length, edges.length, getLayoutedElements])

  const updateNodeQuantitiesCallback = useCallback(
    (targetQuantity: number) => {
      if (!selectedItem) return

      const updatedNodes = updateNodeQuantities(nodes, selectedItem, targetQuantity, recipes)
      setNodes(updatedNodes)
    },
    [nodes, selectedItem, setNodes, recipes]
  )

  const handleItemSelectWithNodes = useCallback(
    (itemId: string) => {
      const result = handleItemSelect(itemId)
      if (!result) return

      const { item, itemRecipes, defaultQuantity } = result

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
    [handleItemSelect, setNodes, setEdges, getLayoutedElements]
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
                  onValueChange={handleItemSelectWithNodes}
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
                            updateQuantity(newQuantity)
                            if (nodes.length > 0 && selectedItem) {
                              updateNodeQuantitiesCallback(newQuantity)
                            }
                          }}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const newQuantity = parseInt(e.target.value) || 1
                            if (newQuantity < minQuantity) {
                              toast.warning(t('toast.quantityAdjusted', { minQuantity }), {
                                description: t('toast.quantityAdjustedDescription')
                              })
                              updateQuantity(minQuantity)
                              if (nodes.length > 0 && selectedItem) {
                                updateNodeQuantitiesCallback(minQuantity)
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
                                <div className="font-medium">{resolveRecipeName(recipe, items)}</div>
                                <div className="text-muted-foreground text-xs">
                                  {t('calculator.produces')}:{' '}
                                  {recipe.output.map((output, i) => {
                                    const outputItem = items.find((item) => item.id === output.item)
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
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={{
                itemNode: ItemNode,
                materialNode: MaterialNode
              }}
              className="h-full"
            />
          </div>
        </div>
      </Container>
    </div>
  )
}

export function FlowVisualizeView({ gameData }: FlowVisualizeViewProps) {
  return (
    <ReactFlowProvider>
      <View gameData={gameData} />
    </ReactFlowProvider>
  )
}
