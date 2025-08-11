export interface DepItem {
  id: number
  name?: string
  tier?: number
}

export interface DepRecipe {
  crafted_output: {
    item_id: number
    qty: number
  }
  inputs: Array<{
    item_id: number
    qty: number
  }>
}

export interface ExpandResult {
  totals: Map<number, number>
  steps: number
}
