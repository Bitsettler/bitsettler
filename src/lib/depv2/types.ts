export interface DepItem {
  id: string // NOW PREFIXED: "item_123", "cargo_456", "resource_789"
  name?: string
  tier?: number
  iconAssetName?: string
  // Add other fields from ItemDesc, ResourceDesc, CargoDesc as needed
  slug?: string
  [key: string]: unknown // Allow other fields from the original data
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

export interface CraftingStep {
  id: string // unique step identifier
  action: 'craft' | 'gather' // type of step
  itemId: string // what to make/gather
  itemName: string // display name
  quantity: number // how many needed
  skill?: string // required skill
  tier?: number // item tier
  ingredients?: Array<{ itemId: string; name: string; quantity: number }> // if crafting
  depth: number // nesting level (0 = final item, higher = dependencies)
  dependencies: string[] // step IDs that must complete first
}

export interface CraftingPlan {
  steps: CraftingStep[] // ordered list of steps
  materials: Map<string, number> // final material totals (base materials only)
  totalSteps: number // total crafting actions
}

export interface ExpandResult {
  totals: Map<string, number> // prefixed itemId -> total quantity needed
  steps: number // total crafting steps
  plan?: CraftingPlan // detailed step-by-step plan
}
