export interface Recipe {
  id: number
  name: string
  output: Array<{
    item: number
    qty: number | number[] | null
  }>
  requirements: {
    materials: Array<{ id: number; qty: number | null }>
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
  itemId?: number
  isDone?: boolean
}
