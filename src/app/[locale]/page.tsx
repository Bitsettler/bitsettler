'use client'

import { Recipe } from '@/lib/types'
import { FlowVisualizeView } from '@/view/flow-visualize-view'

import cargo from '@/data/cargo.json'
import items from '@/data/items.json'
import recipes from '@/data/recipes.json'
import resources from '@/data/resources.json'

// Prepare and combine all game data
const allItems: Array<{
  id: number
  name: string
  slug: string
  tier: number
  rarity: string
  category: string
  description: string
}> = [...items, ...cargo, ...resources]

const gameData = {
  items: allItems,
  recipes: recipes as Recipe[]
}

export default function Home() {
  return <FlowVisualizeView gameData={gameData} />
}
