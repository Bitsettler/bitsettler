import { getItemById, getRecipeByOutputId } from './indexes'
import type { ExpandResult } from './types'

// Simple in-memory cache for memoization
const _cache = new Map<string, ExpandResult>()

/**
 * Expand an item and quantity to its base materials
 * Uses DFS expansion with cycle detection and memoization
 * NOW USES PREFIXED STRING IDs!
 */
export function expandToBase(itemId: string, qty: number): ExpandResult {
  const cacheKey = `${itemId}|${qty}`
  
  // Check cache first
  const cached = _cache.get(cacheKey)
  if (cached) {
    return {
      totals: new Map(cached.totals), // Return a copy to avoid mutation
      steps: cached.steps
    }
  }
  
  const result = _expandToBaseInternal(itemId, qty, new Set())
  
  // Cache the result
  _cache.set(cacheKey, {
    totals: new Map(result.totals), // Store a copy
    steps: result.steps
  })
  
  return result
}

function _expandToBaseInternal(
  itemId: string, 
  qty: number, 
  path: Set<string>
): ExpandResult {
  const recipeByOutputId = getRecipeByOutputId()
  const recipe = recipeByOutputId.get(itemId)
  
  // If no recipe found or cycle detected, treat as base material
  if (!recipe || path.has(itemId)) {
    return {
      totals: new Map([[itemId, qty]]),
      steps: 0
    }
  }
  
  // Add this item to the current path for cycle detection
  const newPath = new Set(path)
  newPath.add(itemId)
  
  const totals = new Map<string, number>()
  let totalSteps = 0
  
  // Calculate how many times we need to craft this recipe
  const outputQty = recipe.crafted_output.qty
  const craftingIterations = Math.ceil(qty / outputQty)
  
  // Count this as one step per crafting iteration
  totalSteps += craftingIterations
  
  // Expand each input material
  for (const input of recipe.inputs) {
    const neededQty = input.qty * craftingIterations
    const inputResult = _expandToBaseInternal(input.item_id, neededQty, newPath)
    
    // Merge totals
    for (const [materialId, materialQty] of inputResult.totals) {
      const existing = totals.get(materialId) || 0
      totals.set(materialId, existing + materialQty)
    }
    
    // Add steps
    totalSteps += inputResult.steps
  }
  
  return {
    totals,
    steps: totalSteps
  }
}

/**
 * Clear the expansion cache (useful for testing or memory management)
 */
export function clearCache(): void {
  _cache.clear()
}
