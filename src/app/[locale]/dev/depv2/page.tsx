'use client'

import { useState, useEffect } from 'react'
import { getItemById } from '@/lib/depv2/indexes'
import { findDeepCraftables } from '@/lib/depv2/itemIndex'
import BaseMaterialsPanelV2 from '@/components/depv2/BaseMaterialsPanelV2'
import ItemPicker from '@/components/depv2/ItemPicker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DepV2DevPage() {
  const [itemId, setItemId] = useState<string>('')
  const [qty, setQty] = useState<number>(1)
  const [deepCraftables, setDeepCraftables] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    // Load deep craftables and auto-select first one
    const deepItems = findDeepCraftables(12)
    setDeepCraftables(deepItems)
    
    if (deepItems.length > 0) {
      setItemId(deepItems[0])
      setIsInitialized(true)
    }
  }, [])
  
  const itemById = getItemById()
  const currentItem = itemById.get(itemId)
  
  const handleRandomDeepItem = () => {
    if (deepCraftables.length > 0) {
      const randomIndex = Math.floor(Math.random() * deepCraftables.length)
      setItemId(deepCraftables[randomIndex])
    }
  }
  
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
          <CardTitle>Item Selection</CardTitle>
          <CardDescription>
            Search for items or use smart picks for complex craftables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Search Items</Label>
            <ItemPicker value={itemId} onChange={setItemId} />
            {currentItem && (
              <p className="text-sm text-muted-foreground">
                Selected: {currentItem.name || currentItem.id}
                {currentItem.tier && ` (Tier ${currentItem.tier})`}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Deep Craftables</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomDeepItem}
                disabled={deepCraftables.length === 0}
              >
                Random deep item
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {deepCraftables.map((id) => {
                const item = itemById.get(id)
                return (
                  <Button
                    key={id}
                    variant={itemId === id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setItemId(id)}
                    className="h-auto py-1"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs">
                        {item?.name || id}
                      </span>
                      {item?.tier && (
                        <Badge variant="secondary" className="text-xs h-4">
                          T{item.tier}
                        </Badge>
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemId">Item ID (Manual)</Label>
              <Input
                id="itemId"
                type="text"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                placeholder="Enter prefixed ID (item_123, cargo_456)"
              />
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
      
      {itemId && (
        <Card>
          <CardHeader>
            <CardTitle>Base Materials Expansion</CardTitle>
            <CardDescription>
              Materials needed to craft {qty}× {currentItem?.name || itemId}
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
