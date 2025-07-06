'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Item } from '@/hooks/use-item-selection'
import { Recipe } from '@/lib/types'
import { getRarityColor, getTierColor } from '@/lib/utils/item-utils'
import { useTranslations } from 'next-intl'

interface CalculatorItemInfoPanelProps {
  selectedItem: Item
  desiredQuantity: number
  onQuantityChange: (quantity: number) => void
  recipes: Recipe[]
}

export function CalculatorItemInfoPanel({
  selectedItem,
  desiredQuantity,
  onQuantityChange,
  recipes
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

  // Find recipes where this item is used as input
  const usedInRecipes = recipes.filter((recipe) =>
    recipe.requirements.materials?.some((material) => material.id === selectedItem.id)
  )

  // Find recipes that produce this item
  const producedByRecipes = recipes.filter((recipe) => recipe.output.some((output) => output.item === selectedItem.id))

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{selectedItem.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        {/* Info Section */}
        <div>
          <h3 className="text-muted-foreground mb-2 text-sm font-semibold">{t('common.info')}</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">{t('common.description')}:</span>
              <p className="text-muted-foreground mt-1">{selectedItem.description || 'No description available'}</p>
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

        {/* Usage Section */}
        <div>
          <h3 className="text-muted-foreground mb-2 text-sm font-semibold">{t('common.usage')}</h3>
          <div className="space-y-2">
            {producedByRecipes.map((recipe) => {
              const outputQty = recipe.output.find((output) => output.item === selectedItem.id)?.qty || 1
              const qty = Array.isArray(outputQty) ? outputQty[0] : outputQty
              return (
                <div key={recipe.id} className="bg-muted/50 rounded-sm p-2">
                  <div className="font-medium">{recipe.name}</div>
                  <div className="text-muted-foreground text-sm">
                    Produces: {qty}x {selectedItem.name}
                  </div>
                </div>
              )
            })}
            {producedByRecipes.length === 0 && (
              <p className="text-muted-foreground text-sm">{t('calculator.noRecipes')}</p>
            )}
          </div>
        </div>

        {/* Quantity Input Section */}
        <div>
          <h3 className="text-muted-foreground mb-2 text-sm font-semibold">{t('calculator.craftingQuantity')}</h3>
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
      </CardContent>
    </Card>
  )
}
