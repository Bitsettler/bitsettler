export interface DepItem {
  id: string // NOW PREFIXED: "item_123", "cargo_456", "resource_789"
  name?: string
  tier?: number
  iconAssetName?: string
  // Add other fields from ItemDesc, ResourceDesc, CargoDesc as needed
  slug?: string
  [key: string]: any // Allow other fields from the original data
}

export interface DepRecipe {
  crafted_output: {
    item_id: string // NOW PREFIXED
    qty: number
  }
  inputs: Array<{
    item_id: string // NOW PREFIXED
    qty: number
  }>
}

export interface ExpandResult {
  totals: Map<string, number> // prefixed itemId -> total quantity needed
  steps: number // total crafting steps
}
