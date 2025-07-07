export interface Recipe {
  id: number
  name: string
  output: Array<{
    item: string
    qty: number | number[] | null
    probability?: number // Drop rate/chance for extraction recipes (0-1)
  }>
  requirements: {
    materials: Array<{ id: string; qty: number | null }>
    professions?: string
    tool?: string
    building?: string
  }
}

export interface ItemData {
  label: string
  tier: number
  rarity: string
  category: string
  quantity?: number
  recipes?: Recipe[]
  selectedRecipe?: Recipe | null
  itemId?: string
  isDone?: boolean
}
