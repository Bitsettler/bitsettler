'use client'

import { useState, useEffect } from 'react'
import { getRecipeByOutputId, getItemById } from '@/lib/depv2/indexes'
import BaseMaterialsPanelV2 from '@/components/depv2/BaseMaterialsPanelV2'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DepV2DevPage() {
  const [itemId, setItemId] = useState<number>(0)
  const [qty, setQty] = useState<number>(1)
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    // Auto-pick a valid craftable item on mount
    const recipeByOutputId = getRecipeByOutputId()
    const itemById = getItemById()
    
    // Find first craftable item with a name
    for (const [outputId] of recipeByOutputId) {
      const item = itemById.get(outputId)
      if (item?.name) {
        setItemId(outputId)
        setIsInitialized(true)
        break
      }
    }
    
    // Fallback to first available craftable item
    if (!isInitialized && recipeByOutputId.size > 0) {
      const firstCraftableId = Array.from(recipeByOutputId.keys())[0]
      setItemId(firstCraftableId)
      setIsInitialized(true)
    }
  }, [isInitialized])
  
  const itemById = getItemById()
  const currentItem = itemById.get(itemId)
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dependency Engine v2 - Dev</h1>
        <p className="text-muted-foreground">
          Test the minimal dependency expansion engine
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Input Parameters</CardTitle>
          <CardDescription>
            Specify an item ID and quantity to expand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemId">Item ID</Label>
              <Input
                id="itemId"
                type="number"
                value={itemId}
                onChange={(e) => setItemId(parseInt(e.target.value) || 0)}
                placeholder="Enter item ID"
              />
              {currentItem && (
                <p className="text-sm text-muted-foreground">
                  {currentItem.name || `#${currentItem.id}`}
                  {currentItem.tier && ` (Tier ${currentItem.tier})`}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                placeholder="Enter quantity"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {itemId > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Base Materials Expansion</CardTitle>
            <CardDescription>
              Materials needed to craft {qty}× {currentItem?.name || `#${itemId}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BaseMaterialsPanelV2 itemId={itemId} qty={qty} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
