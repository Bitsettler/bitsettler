import { Recipe } from '@/lib/types'
import { useCallback, useState } from 'react'

interface Item {
  id: number
  name: string
  slug: string
  tier: number
  rarity: string
  category: string
  description: string
}

interface UseItemSelectionProps {
  items: Item[]
  recipes: Recipe[]
}

export const useItemSelection = ({ items, recipes }: UseItemSelectionProps) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [desiredQuantity, setDesiredQuantity] = useState(1)
  const [minQuantity, setMinQuantity] = useState(1)

  const handleItemSelect = useCallback(
    (itemId: string) => {
      const item = items.find((item) => item.id.toString() === itemId)
      if (!item) return

      // Find recipes for this specific item
      const itemRecipes = recipes.filter((recipe) => recipe.output.some((output) => output.item === item.id))

      // Calculate default quantity based on recipe output
      let defaultQuantity = 1
      let minQty = 1
      if (itemRecipes.length > 0) {
        // Use the first recipe's output quantity as default and minimum
        const firstRecipe = itemRecipes[0]
        const outputItem = firstRecipe.output.find((output) => output.item === item.id)
        if (outputItem && outputItem.qty) {
          defaultQuantity = Array.isArray(outputItem.qty) ? outputItem.qty[0] : outputItem.qty
          minQty = defaultQuantity // Minimum quantity is the same as the recipe output
        }
      }

      setSelectedItem(item)
      setDesiredQuantity(defaultQuantity)
      setMinQuantity(minQty)

      return { item, itemRecipes, defaultQuantity }
    },
    [items, recipes]
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
