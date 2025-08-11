'use client'

import { useState, useEffect } from 'react'
import { getItemById } from '@/lib/depv2/indexes'
import { findDeepCraftables } from '@/lib/depv2/itemIndex'
import BaseMaterialsPanelV2 from '@/components/depv2/BaseMaterialsPanelV2'
import CraftingStepsPanel from '@/components/depv2/CraftingStepsPanel'
import ItemPicker from '@/components/depv2/ItemPicker'
import { expandToBase } from '@/lib/depv2/engine'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Shuffle, Package2, ListChecks } from 'lucide-react'

export default function DepV2DevPage() {
  const [itemId, setItemId] = useState<string>('')
  const [qty, setQty] = useState<number>(1)
  const [deepCraftables, setDeepCraftables] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [showSteps, setShowSteps] = useState<boolean>(false)
  
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
  
  // Get expansion result with optional crafting plan
  const expansionResult = itemId ? expandToBase(itemId, qty, showSteps) : null
  
  const handleRandomDeepItem = () => {
    if (deepCraftables.length > 0) {
      const randomIndex = Math.floor(Math.random() * deepCraftables.length)
      setItemId(deepCraftables[randomIndex])
    }
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Package2 className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Dependency Engine v2</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Calculate materials and generate step-by-step crafting plans for any item
        </p>
      </div>

      {/* Item Selection */}
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Item Selection
          </CardTitle>
          <CardDescription>
            Search for items by name or choose from complex craftables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Search Items</Label>
            <ItemPicker value={itemId} onChange={setItemId} />
            {currentItem && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Package2 className="h-4 w-4 text-primary" />
                <span className="font-medium">{currentItem.name || currentItem.id}</span>
                {currentItem.tier && (
                  <Badge variant="secondary">Tier {currentItem.tier}</Badge>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Quick Picks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Complex Craftables</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomDeepItem}
                disabled={deepCraftables.length === 0}
                className="gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Random Item
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {deepCraftables.map((id) => {
                const item = itemById.get(id)
                const isSelected = itemId === id
                return (
                  <Button
                    key={id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setItemId(id)}
                    className="h-auto p-3 justify-start"
                  >
                    <div className="flex flex-col items-start gap-1 min-w-0">
                      <span className="text-xs font-medium truncate w-full text-left">
                        {item?.name || id}
                      </span>
                      {item?.tier && (
                        <Badge variant={isSelected ? "secondary" : "outline"} className="text-xs h-4">
                          T{item.tier}
                        </Badge>
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Settings Section */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty" className="text-base font-medium">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                max="1000"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="itemId" className="text-base font-medium">Manual ID Entry</Label>
              <Input
                id="itemId"
                type="text"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                placeholder="item_123, cargo_456..."
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Detailed Steps</Label>
              <div className="flex items-center space-x-3 pt-2">
                <Switch
                  id="showSteps"
                  checked={showSteps}
                  onCheckedChange={setShowSteps}
                />
                <Label htmlFor="showSteps" className="text-sm text-muted-foreground">
                  Generate crafting plan
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Section */}
      {itemId && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              Crafting Plan for {qty}× {currentItem?.name || itemId}
            </h2>
            <p className="text-muted-foreground">
              {expansionResult ? `${Array.from(expansionResult.totals.size)} materials • ${expansionResult.steps} crafting actions` : 'Calculating...'}
            </p>
          </div>

          {/* Results Grid */}
          <div className={`grid gap-6 ${showSteps && expansionResult?.plan ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
            {/* Base Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Base Materials
                </CardTitle>
                <CardDescription>
                  Raw materials needed for crafting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BaseMaterialsPanelV2 itemId={itemId} qty={qty} />
              </CardContent>
            </Card>
            
            {/* Crafting Steps */}
            {showSteps && expansionResult?.plan && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    Crafting Steps
                  </CardTitle>
                  <CardDescription>
                    Step-by-step crafting instructions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <CraftingStepsPanel plan={expansionResult.plan} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Step Generation Prompt */}
          {!showSteps && (
            <div className="text-center">
              <Card className="inline-block">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <ListChecks className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Want step-by-step instructions?</p>
                      <p className="text-sm text-muted-foreground">Enable detailed crafting steps above</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowSteps(true)}
                      className="gap-2"
                    >
                      <ListChecks className="h-4 w-4" />
                      Generate Steps
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* No Selection State */}
      {!itemId && (
        <div className="text-center py-12">
          <Card className="inline-block">
            <CardContent className="p-8">
              <div className="space-y-4">
                <Package2 className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">Select an Item</h3>
                  <p className="text-muted-foreground">Choose an item above to see its crafting requirements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
