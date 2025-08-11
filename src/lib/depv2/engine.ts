import { getItemById, getRecipeByOutputId } from './indexes'
import { getItemDisplay } from './display'
import type { ExpandResult, CraftingPlan, CraftingStep } from './types'

// Simple in-memory cache for memoization
const _cache = new Map<string, ExpandResult>()

/**
 * Expand an item and quantity to its base materials
 * Uses DFS expansion with cycle detection and memoization
 * NOW USES PREFIXED STRING IDs!
 */
export function expandToBase(itemId: string, qty: number, generatePlan: boolean = false): ExpandResult {
  const cacheKey = `${itemId}|${qty}|${generatePlan}`
  
  // Check cache first
  const cached = _cache.get(cacheKey)
  if (cached) {
    return {
      totals: new Map(cached.totals), // Return a copy to avoid mutation
      steps: cached.steps,
      plan: cached.plan ? {
        steps: [...cached.plan.steps],
        materials: new Map(cached.plan.materials),
        totalSteps: cached.plan.totalSteps
      } : undefined
    }
  }
  
  const result = _expandToBaseInternal(itemId, qty, new Set())
  
  // Generate detailed plan if requested
  let plan: CraftingPlan | undefined
  if (generatePlan) {
    plan = generateCraftingPlan(itemId, qty)
  }
  
  const finalResult = {
    totals: result.totals,
    steps: result.steps,
    plan
  }
  
  // Cache the result
  _cache.set(cacheKey, {
    totals: new Map(result.totals), // Store a copy
    steps: result.steps,
    plan: plan ? {
      steps: [...plan.steps],
      materials: new Map(plan.materials),
      totalSteps: plan.totalSteps
    } : undefined
  })
  
  return finalResult
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
 * Generate a detailed crafting plan with step-by-step instructions
 */
function generateCraftingPlan(itemId: string, qty: number): CraftingPlan {
  const recipeByOutputId = getRecipeByOutputId()
  const steps: CraftingStep[] = []
  const materials = new Map<string, number>()
  let stepCounter = 0
  
  function generateStepsRecursive(
    currentItemId: string, 
    currentQty: number, 
    depth: number,
    path: Set<string> = new Set()
  ): string[] {
    const stepIds: string[] = []
    const recipe = recipeByOutputId.get(currentItemId)
    const itemDisplay = getItemDisplay(currentItemId)
    
    // If no recipe or cycle detected, this is a base material
    if (!recipe || path.has(currentItemId)) {
      const existing = materials.get(currentItemId) || 0
      materials.set(currentItemId, existing + currentQty)
      
      const stepId = `gather-${stepCounter++}`
      steps.push({
        id: stepId,
        action: 'gather',
        itemId: currentItemId,
        itemName: itemDisplay.name,
        quantity: currentQty,
        skill: itemDisplay.skill,
        tier: itemDisplay.tier,
        depth,
        dependencies: []
      })
      stepIds.push(stepId)
      return stepIds
    }
    
    // Calculate crafting iterations needed
    const outputQty = recipe.crafted_output.qty
    const craftingIterations = Math.ceil(currentQty / outputQty)
    
    const newPath = new Set(path)
    newPath.add(currentItemId)
    
    // Generate steps for all ingredients first (dependencies)
    const dependencyStepIds: string[] = []
    const ingredients: Array<{ itemId: string; name: string; quantity: number }> = []
    
    for (const input of recipe.inputs) {
      const neededQty = input.qty * craftingIterations
      const inputDisplay = getItemDisplay(input.item_id)
      
      ingredients.push({
        itemId: input.item_id,
        name: inputDisplay.name,
        quantity: neededQty
      })
      
      const inputStepIds = generateStepsRecursive(input.item_id, neededQty, depth + 1, newPath)
      dependencyStepIds.push(...inputStepIds)
    }
    
    // Now create the crafting step for this item
    const craftStepId = `craft-${stepCounter++}`
    steps.push({
      id: craftStepId,
      action: 'craft',
      itemId: currentItemId,
      itemName: itemDisplay.name,
      quantity: currentQty,
      skill: itemDisplay.skill,
      tier: itemDisplay.tier,
      ingredients,
      depth,
      dependencies: dependencyStepIds
    })
    stepIds.push(craftStepId)
    
    return stepIds
  }
  
  generateStepsRecursive(itemId, qty, 0)
  
  return {
    steps,
    materials,
    totalSteps: steps.filter(s => s.action === 'craft').length
  }
}

/**
 * Clear the expansion cache (useful for testing or memory management)
 */
export function clearCache(): void {
  _cache.clear()
}
