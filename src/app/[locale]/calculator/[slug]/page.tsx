import cargo from '@/data/cargo.json'
import extractionRecipes from '@/data/extraction-recipes.json'
import items from '@/data/items.json'
import craftingRecipes from '@/data/recipes.json'
import resources from '@/data/resources.json'
import { Recipe } from '@/lib/types'
import { FlowVisualizeView } from '@/views/calculator-views/calculator-view'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
  searchParams: Promise<{
    qty?: string
  }>
}

// Prepare and combine all game data
const allItems = [...items, ...cargo, ...resources]

// Merge crafting and extraction recipes
const allRecipes = [...craftingRecipes, ...extractionRecipes] as Recipe[]

const gameData = {
  items: allItems,
  recipes: allRecipes
}

export default async function Calculator({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { qty } = await searchParams

  // Find the item by slug
  const selectedItem = allItems.find((item) => item.slug === slug)
  const quantity = parseInt(qty || '1')

  // If item not found, show 404
  if (!selectedItem) {
    notFound()
  }

  return <FlowVisualizeView gameData={gameData} initialItemId={selectedItem.id.toString()} initialQuantity={quantity} />
}
