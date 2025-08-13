'use client'

import { useState, useEffect, useMemo } from 'react'
import { getItemById } from '@/lib/depv2/indexes'
import { findDeepCraftables } from '@/lib/depv2/itemIndex'
import { getItemDisplay } from '@/lib/depv2/display'
import CraftingStepsPanel from '@/components/depv2/CraftingStepsPanel'
import ItemPicker from '@/components/depv2/ItemPicker'
import { CalculatorV2Hero } from '@/components/depv2/CalculatorV2Hero'
import { toast } from '@/components/depv2/ToasterClient'
import { expandToBase } from '@/lib/depv2/engine'
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calculator, Search, Shuffle, Package2, Lightbulb, Copy, Download } from 'lucide-react'
import type { MaterialRow, Group } from '@/components/depv2/types'
import { BricoTierBadge } from '@/components/ui/brico-tier-badge'
import '@/styles/depv2.css'

export function CalculatorNewView() {
  const [itemId, setItemId] = useState<string>('')
  const [qty, setQty] = useState<number>(1)
  const [deepCraftables, setDeepCraftables] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [groupBy, setGroupBy] = useState<'skill' | 'tier' | 'none'>('skill')
  const [showSteps, setShowSteps] = useState<boolean>(false)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Telemetry: Track page load
    console.info('calc2_load_start')
    
    // Load deep craftables but don't auto-select
    const deepItems = findDeepCraftables(12)
    setDeepCraftables(deepItems)
    setIsInitialized(true)
    
    // Telemetry: Track page loaded
    setTimeout(() => console.info('calc2_load_end'), 0)
  }, [])
  
  const itemById = getItemById()
  const currentItem = itemById.get(itemId)
  
  // Get expansion result with optional crafting plan
  const expansionResult = useMemo(() => {
    if (!itemId) return null
    
    try {
      setError(null)
      setIsCalculating(true)
      
      const startTime = performance.now()
      const result = expandToBase(itemId, qty, showSteps)
      const endTime = performance.now()
      
      // Telemetry: Track calculation performance
      console.info(`calc2_run_ms: ${Math.round(endTime - startTime)}`)
      
      return result
    } catch (err) {
      console.error('Calculation error:', err)
      setError('Failed to compute materials. Please try a different item.')
      toast.error('Failed to compute materials')
      return null
    } finally {
      setIsCalculating(false)
    }
  }, [itemId, qty, showSteps])
  
  const handleRandomDeepItem = () => {
    if (deepCraftables.length > 0) {
      const randomIndex = Math.floor(Math.random() * deepCraftables.length)
      const randomItemId = deepCraftables[randomIndex]
      const randomItem = itemById.get(randomItemId)
      
      setItemId(randomItemId)
      toast.success(`Selected random item: ${randomItem?.name || 'Unknown Item'}`)
    }
  }
  
  const handleGroupByChange = (value: string) => {
    if (value) {
      setGroupBy(value as 'skill' | 'tier' | 'none')
    }
  }
  
  // Convert materials to our MaterialRow format for new components
  const materialRows: MaterialRow[] = useMemo(() => {
    if (!expansionResult?.totals) return []
    
    return Array.from(expansionResult.totals.entries()).map(([materialId, materialQty]) => {
      const display = getItemDisplay(materialId)
      return {
        id: materialId,
        name: display.name,
        qty: materialQty,
        tier: display.tier,
        iconSrc: display.icon,
        skill: display.skill
      }
    }).sort((a, b) => {
      // Sort by tier first (1-10), then by name
      // Treat tier -1 (no tier) as a special case and put at end
      const tierA = (a.tier && a.tier > 0) ? a.tier : 999 // Items without tier or tier -1 go to end
      const tierB = (b.tier && b.tier > 0) ? b.tier : 999
      
      if (tierA !== tierB) {
        return tierA - tierB // Ascending tier order (1, 2, 3... 10, then No Tier)
      }
      
      // If same tier (or both have no tier), sort by name
      return a.name.localeCompare(b.name)
    })
  }, [expansionResult])
  
  // Group materials based on groupBy setting
  const groupedMaterials: Group[] = useMemo(() => {
    if (groupBy === 'none') {
      return [{
        title: 'All Materials',
        count: materialRows.length,
        rows: materialRows
      }]
    }
    
    const groups: Record<string, MaterialRow[]> = {}
    
    materialRows.forEach(row => {
      let groupKey: string
      
      if (groupBy === 'skill') {
        groupKey = row.skill || 'Unknown Skill'
      } else if (groupBy === 'tier') {
        groupKey = (row.tier && row.tier > 0) ? `Tier ${row.tier}` : 'No Tier'
      } else {
        groupKey = 'All Materials'
      }
      
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(row)
    })
    
    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (groupBy === 'tier') {
          // Sort tiers numerically
          const tierA = a.includes('Tier') ? parseInt(a.split(' ')[1]) : 999
          const tierB = b.includes('Tier') ? parseInt(b.split(' ')[1]) : 999
          return tierA - tierB
        }
        return a.localeCompare(b)
      })
      .map(([title, rows]) => ({
        title,
        count: rows.length,
        rows
      }))
  }, [materialRows, groupBy])
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Calculator className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Project Calculator</h1>
          <Badge className="bg-secondary text-secondary-foreground">Projects</Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Project-focused crafting calculator with collaboration features and advanced planning
        </p>
      </div>

      {/* Controls card */}
      <Card className="mx-auto max-w-5xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Calculate Materials</CardTitle>
          <CardDescription className="mt-1">Search for any craftable item and set quantity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Search row */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="search" className="text-sm font-medium">Search for any item</Label>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <ItemPicker 
                    onChange={setItemId}
                    value={itemId}
                  />
                </div>
                <Button variant="secondary" className="shrink-0">⌘K</Button>
              </div>
            </div>
            <div>
              <Label htmlFor="qty" className="text-sm font-medium">How many?</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  id="qty" 
                  type="number" 
                  min={1} 
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  className="h-10" 
                />
                <Button 
                  variant="outline" 
                  className="whitespace-nowrap"
                  onClick={handleRandomDeepItem}
                  disabled={deepCraftables.length === 0}
                >
                  Try random
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Secondary controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Group by</span>
              <ToggleGroup 
                type="single" 
                value={groupBy} 
                onValueChange={handleGroupByChange}
                className="[&>*]:px-3"
              >
                <ToggleGroupItem value="skill">Skill</ToggleGroupItem>
                <ToggleGroupItem value="tier">Tier</ToggleGroupItem>
                <ToggleGroupItem value="none">Flat list</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id="steps" 
                checked={showSteps}
                onCheckedChange={setShowSteps}
              />
              <Label htmlFor="steps">Show crafting steps</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mx-auto max-w-5xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Materials section */}
      {itemId && expansionResult && (
        <section className="mx-auto max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Materials</h2>
              <span className="text-sm text-muted-foreground">
                {materialRows.length} materials • {expansionResult.steps} steps
              </span>
            </div>
          </div>

          {isCalculating ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="multiple" className="divide-y divide-border rounded-lg border">
              {groupedMaterials.map((group) => (
                <AccordionItem key={group.title} value={group.title}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex w-full items-center justify-between">
                      <span className="font-medium">{group.title}</span>
                      <Badge variant="secondary">{group.count} items</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
                          <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                            <th>Item</th>
                            <th className="w-24">Qty</th>
                            <th className="w-28">Tier</th>
                            <th className="w-40">Skill</th>
                          </tr>
                        </thead>
                        <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
                          {group.rows.map((row) => (
                            <tr key={row.id} className="[&>td]:px-3 [&>td]:py-2">
                              <td className="flex items-center gap-2">
                                <div className="relative h-8 w-8 rounded border bg-muted p-1">
                                  {row.iconSrc ? (
                                    <img 
                                      src={row.iconSrc} 
                                      alt={row.name}
                                      className="w-full h-full object-contain" 
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-muted-foreground/20 rounded flex items-center justify-center">
                                      <span className="text-xs">?</span>
                                    </div>
                                  )}
                                </div>
                                <span className="font-medium">{row.name}</span>
                              </td>
                              <td className="font-mono font-semibold">{row.qty.toLocaleString()}</td>
                              <td>
                                {(row.tier && row.tier > 0) && (
                                  <BricoTierBadge tier={row.tier} size="sm" className="shrink-0" />
                                )}
                              </td>
                              <td className="text-muted-foreground">{row.skill || 'Unknown'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>
      )}

      {/* Crafting Steps */}
      {showSteps && expansionResult?.plan && (
        <section className="mx-auto max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" />
                Crafting Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CraftingStepsPanel 
                plan={expansionResult.plan}
                className="w-full"
              />
            </CardContent>
          </Card>
        </section>
      )}

      {/* Help Section */}
      {!itemId && isInitialized && (
        <Card className="mx-auto max-w-5xl">
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
              <p>• <strong>Group materials</strong> by skill, tier, or view as a flat list</p>
              <p>• The engine automatically optimizes materials and detects recipe cycles</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky footer actions */}
      {itemId && expansionResult && (
        <div className="sticky bottom-4 z-10 mx-auto flex max-w-5xl justify-end">
          <div className="rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Plan
              </Button>
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
