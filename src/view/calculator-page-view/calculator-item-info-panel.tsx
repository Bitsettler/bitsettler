'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Item } from '@/hooks/use-item-selection'
import { Recipe } from '@/lib/types'
import { getRarityColor, getTierColor } from '@/lib/utils/item-utils'
import { resolveRecipeName } from '@/lib/utils/recipe-utils'
import { useTranslations } from 'next-intl'

interface CalculatorItemInfoPanelProps {
  selectedItem: Item | undefined
  desiredQuantity: number
  onQuantityChange: (quantity: number) => void
  recipes: Recipe[]
  items: Item[]
}

export function CalculatorItemInfoPanel({
  selectedItem,
  desiredQuantity,
  onQuantityChange,
  recipes,
  items
}: CalculatorItemInfoPanelProps) {
  const t = useTranslations()

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value) || 1
    onQuantityChange(newQuantity)
  }

  const handleQuantityInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value) || 1
    onQuantityChange(Math.max(1, newQuantity))
  }

  if (!selectedItem) return null

  // Find recipes where this item is used as input
  const usedInRecipes = recipes.filter((recipe) =>
    recipe.requirements.materials?.some((material) => material.id?.toString() === selectedItem.id.toString())
  )

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-y-8">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="mb-2">{selectedItem.name}</CardTitle>
          <div className="flex flex-wrap gap-1">
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
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col space-y-8">
          {/* Quantity Input Section */}
          <div className="flex-shrink-0">
            <h3 className="text-foreground mb-2 text-sm font-semibold">{t('calculator.craftingQuantity')}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={desiredQuantity}
                  onChange={handleQuantityInputChange}
                  onBlur={handleQuantityInputBlur}
                  min={1}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">{t('calculator.itemsToCraft')}</span>
              </div>
              <div className="text-muted-foreground text-xs">Minimum: 1 (one complete recipe execution)</div>
            </div>
          </div>

          {/* Usage Section */}
          <div className="flex min-h-0 flex-1 flex-col">
            <h3 className="text-foreground mb-2 flex-shrink-0 text-sm font-semibold">{t('common.usage')}</h3>
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {usedInRecipes.length > 0 ? (
                  usedInRecipes.map((recipe, index) => (
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
      </div>
    </Card>
  )
}
