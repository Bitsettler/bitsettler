import cargo from '@/data/cargo.json'
import items from '@/data/items.json'
import recipes from '@/data/recipes.json'
import resources from '@/data/resources.json'
import { Recipe } from '@/lib/types'
import { FlowVisualizeView } from '@/view/calculator-page-view/calculator-view'
import { notFound } from 'next/navigation'

interface CalculatorProps {
  params: {
    slug: string
  }
  searchParams: {
    qty?: string
  }
}

// Prepare and combine all game data
const allItems = [...items, ...cargo, ...resources]

const gameData = {
  items: allItems,
  recipes: recipes as Recipe[]
}

export default function Calculator({ params, searchParams }: CalculatorProps) {
  // Find the item by slug
  const selectedItem = allItems.find((item) => item.slug === params.slug)
  const quantity = parseInt(searchParams.qty || '1')

  // If item not found, show 404
  if (!selectedItem) {
    notFound()
  }

  return <FlowVisualizeView gameData={gameData} initialItemId={selectedItem.id.toString()} initialQuantity={quantity} />
}
