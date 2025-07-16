import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCalculatorSaves } from '@/hooks/use-calculator-saves'
import type { CalculatorItem } from '@/lib/spacetime-db'
import { getRarityColor, getTierColor } from '@/lib/utils/item-utils'
import { CalculatorSearchInput } from '@/views/calculator-views/calculator-search-input'
import { useReactFlow } from '@xyflow/react'
import { MoreHorizontal, Save } from 'lucide-react'
import { toast } from 'sonner'

interface CalculatorHeaderProps {
  items: CalculatorItem[]
  selectedItem: CalculatorItem | undefined
  desiredQuantity: number
  onItemSelect: (slug: string) => void
  onQuantityChange: (quantity: number) => void
}

export function CalculatorHeader({
  items,
  selectedItem,
  desiredQuantity,
  onItemSelect,
  onQuantityChange
}: CalculatorHeaderProps) {
  const { saveCalculator } = useCalculatorSaves()
  const { getNodes, getEdges } = useReactFlow()

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value) || 1
    onQuantityChange(newQuantity)
  }

  const handleQuantityInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value) || 1
    onQuantityChange(Math.max(1, newQuantity))
  }

  const handleSave = () => {
    if (!selectedItem) {
      toast.error('Cannot save: No item selected to save.')
      return
    }

    const nodes = getNodes()
    const edges = getEdges()

    if (nodes.length === 0) {
      toast.error('Cannot save: No recipe tree to save.')
      return
    }

    try {
      saveCalculator(selectedItem.slug, desiredQuantity, nodes, edges)
      toast.success(`Calculator saved! Saved "${selectedItem.name}" with ${desiredQuantity}x quantity.`)
    } catch {
      toast.error('Save failed: Failed to save calculator state.')
    }
  }

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex items-center gap-4 p-4 pb-0 backdrop-blur">
      {/* Search Combo Box */}
      <div className="w-80">
        <CalculatorSearchInput items={items} selectedItem={selectedItem} onItemSelect={onItemSelect} />
      </div>

      <div className="text-sm">X</div>

      {/* Quantity Input */}
      <div className="w-20">
        <Input
          type="number"
          min="1"
          value={desiredQuantity}
          onChange={handleQuantityInputChange}
          onBlur={handleQuantityInputBlur}
          className="text-center"
        />
      </div>

      {/* Separator */}
      <div className="bg-border h-6 w-px" />

      {/* Item Info Badges */}
      {selectedItem && (
        <div className="flex items-center gap-2">
          {selectedItem.tier > 0 && (
            <Badge variant="outline" className={getTierColor(selectedItem.tier)}>
              Tier {selectedItem.tier}
            </Badge>
          )}
          <Badge variant="outline" className={getRarityColor(selectedItem.rarity)}>
            {selectedItem.rarity}
          </Badge>
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            {selectedItem.category}
          </Badge>
        </div>
      )}

      {/* Spacer to push buttons to the right */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                Export as Image
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Share Link
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Reset Layout
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
