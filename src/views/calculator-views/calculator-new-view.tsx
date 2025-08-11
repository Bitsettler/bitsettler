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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package2, Search, Shuffle, Calculator, Lightbulb, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function CalculatorNewView() {
  const [itemId, setItemId] = useState<string>('')
  const [qty, setQty] = useState<number>(1)
  const [deepCraftables, setDeepCraftables] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [showSteps, setShowSteps] = useState<boolean>(false)
  
  useEffect(() => {
    // Load deep craftables but don't auto-select
    const deepItems = findDeepCraftables(12)
    setDeepCraftables(deepItems)
    setIsInitialized(true)
    
    // Optional: You can still auto-select if you want a specific item
    // setItemId(deepItems[0])
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
          <Calculator className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Calculator ✨</h1>
          <Badge variant="secondary" className="text-sm">
            v2
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Advanced dependency engine with step-by-step crafting plans and optimized material calculations
        </p>
        
        {/* Navigation Links */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link href="/en/calculator">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Calculator v1
            </Button>
          </Link>
        </div>
      </div>

      {/* Beta Notice */}
      <Alert className="mx-auto max-w-4xl">
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          This is the enhanced v2 calculator with advanced features. We're running both versions side-by-side to gather feedback. 
          <Link href="/en/calculator" className="underline ml-1">Compare with v1</Link> or 
          <a href="mailto:feedback@bitsettler.com" className="underline ml-1">share your thoughts</a>.
        </AlertDescription>
      </Alert>

      {/* Item Selection */}
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Calculate Materials
          </CardTitle>
          <CardDescription>
            Search for any item and specify how many you need to craft
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Input Section */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Item Search */}
            <div className="md:col-span-2 space-y-3">
              <Label className="text-base font-medium">Search for any item</Label>
              <ItemPicker 
                onChange={setItemId}
                value={itemId}
              />
              <p className="text-sm text-muted-foreground">
                Search by name (e.g. "Iron Sword", "Healing Potion") or browse with random
              </p>
            </div>
            
            {/* Quantity & Random */}
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="qty" className="text-base font-medium">How many?</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  max="1000"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  className="text-base"
                  placeholder="1"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomDeepItem}
                disabled={deepCraftables.length === 0}
                className="gap-2 w-full"
              >
                <Shuffle className="h-4 w-4" />
                Try Random Item
              </Button>
            </div>
          </div>

          <Separator />

          {/* Options */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Selected Item</Label>
              <div className="text-sm text-muted-foreground mt-1">
                {currentItem ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentItem.name}</span>
                    {currentItem.tier && (
                      <Badge variant="secondary" className="text-xs">
                        T{currentItem.tier}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span>No item selected</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-steps"
                checked={showSteps}
                onCheckedChange={setShowSteps}
              />
              <Label htmlFor="show-steps" className="text-sm font-medium">
                Show crafting steps
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {expansionResult && (
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Base Materials */}
          <BaseMaterialsPanelV2 
            materialTotals={expansionResult.totals}
            totalSteps={expansionResult.steps}
            className="w-full"
          />
          
          {/* Crafting Steps */}
          {showSteps && expansionResult.plan && (
            <CraftingStepsPanel 
              plan={expansionResult.plan}
              className="w-full"
            />
          )}
        </div>
      )}

      {/* Help Section */}
      {!itemId && isInitialized && (
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• <strong>Search for any item</strong> by typing its name (weapons, tools, potions, etc.)</p>
              <p>• <strong>Set quantity</strong> to see materials needed for multiple items</p>
              <p>• <strong>Try random item</strong> to discover complex crafting recipes</p>
              <p>• <strong>Enable crafting steps</strong> for detailed instructions with skill requirements</p>
              <p>• The engine automatically optimizes materials and detects recipe cycles</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
