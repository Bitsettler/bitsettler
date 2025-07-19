import type { CalculatorItem, CalculatorRecipe } from '@/lib/spacetime-db/shared/dtos/calculator-dtos'
import { useCallback, useState } from 'react'

interface UseItemSelectionProps {
  items: CalculatorItem[]
  recipes: CalculatorRecipe[]
  initialQuantity?: number
}

export const useItemSelection = ({ items, recipes, initialQuantity = 1 }: UseItemSelectionProps) => {
  const [selectedItem, setSelectedItem] = useState<CalculatorItem | null>(null)
  const [desiredQuantity, setDesiredQuantity] = useState(initialQuantity)
  const [minQuantity, setMinQuantity] = useState(1)

  const handleItemSelect = useCallback(
    (itemId: string) => {
      const item = items.find((item) => item.id === itemId)

      if (!item) return

      // Find recipes for this specific item
      const itemRecipes = recipes.filter((recipe) => recipe.output.some((output) => output.item === item.id))

      // Calculate default quantity based on recipe output
      let defaultQuantity = initialQuantity
      let minQty = 1
      if (itemRecipes.length > 0) {
        // Use the first recipe's output quantity as default and minimum
        const firstRecipe = itemRecipes[0]
        const outputItem = firstRecipe.output.find((output) => output.item === item.id)
        if (outputItem && outputItem.qty) {
          const recipeQty = Array.isArray(outputItem.qty) ? outputItem.qty[0] : outputItem.qty
          minQty = recipeQty // Minimum quantity is the same as the recipe output
          defaultQuantity = Math.max(initialQuantity, recipeQty) // Use initialQuantity if it's larger than recipe minimum
        }
      }

      setSelectedItem(item)
      setDesiredQuantity(defaultQuantity)
      setMinQuantity(minQty)

      return { item, itemRecipes, defaultQuantity }
    },
    [items, recipes, initialQuantity]
  )

  const updateQuantity = useCallback((newQuantity: number) => {
    setDesiredQuantity(newQuantity)
  }, [])

  return {
    selectedItem,
    desiredQuantity,
    minQuantity,
    handleItemSelect,
    updateQuantity,
    setSelectedItem,
    setDesiredQuantity,
    setMinQuantity
  }
}
