import { getItemById, getRecipeByOutputId } from './indexes'

export interface ItemIndexEntry {
  id: number
  name?: string
  tier?: number
  craftable?: boolean
}

/**
 * Get all items with metadata for searching and display
 */
export function getItemIndex(): ItemIndexEntry[] {
  const itemById = getItemById()
  const recipeByOutputId = getRecipeByOutputId()
  
  const items: ItemIndexEntry[] = []
  
  for (const [id, item] of itemById) {
    items.push({
      id,
      name: item.name,
      tier: item.tier,
      craftable: recipeByOutputId.has(id)
    })
  }
  
  return items.sort((a, b) => a.id - b.id)
}

/**
 * Find deep craftable items (items whose recipes require other craftable items)
 * Returns item IDs sorted by complexity (deeper recipes first)
 */
export function findDeepCraftables(limit: number = 12): number[] {
  const recipeByOutputId = getRecipeByOutputId()
  const itemById = getItemById()
  const deepCraftables: Array<{ id: number; depth: number }> = []
  
  for (const [outputId, recipe] of recipeByOutputId) {
    let depth = 1
    let hasDeepInputs = false
    
    // Check if any input is also craftable
    for (const input of recipe.inputs) {
      if (recipeByOutputId.has(input.item_id)) {
        hasDeepInputs = true
        depth = Math.max(depth, 2)
        
        // Check for even deeper nesting
        const subRecipe = recipeByOutputId.get(input.item_id)
        if (subRecipe) {
          for (const subInput of subRecipe.inputs) {
            if (recipeByOutputId.has(subInput.item_id)) {
              depth = Math.max(depth, 3)
              break
            }
          }
        }
      }
    }
    
    // Only include items that have deep crafting (depth >= 2) and valid names
    if (hasDeepInputs && depth >= 2) {
      const item = itemById.get(outputId)
      if (item?.name) {
        deepCraftables.push({ id: outputId, depth })
      }
    }
  }
  
  // Sort by depth (descending) then by name
  deepCraftables.sort((a, b) => {
    if (a.depth !== b.depth) return b.depth - a.depth
    const aItem = itemById.get(a.id)
    const bItem = itemById.get(b.id)
    const aName = aItem?.name || `#${a.id}`
    const bName = bItem?.name || `#${b.id}`
    return aName.localeCompare(bName)
  })
  
  return deepCraftables.slice(0, limit).map(item => item.id)
}

/**
 * Search items by name with fuzzy-lite matching
 * Priority: exact match > prefix match > contains match
 */
export function searchItems(query: string, take: number = 20): ItemIndexEntry[] {
  if (!query.trim()) return []
  
  const itemIndex = getItemIndex()
  const q = query.toLowerCase().trim()
  
  const exact: ItemIndexEntry[] = []
  const prefix: ItemIndexEntry[] = []
  const contains: ItemIndexEntry[] = []
  const idMatches: ItemIndexEntry[] = []
  
  for (const item of itemIndex) {
    const name = item.name?.toLowerCase() || ''
    const idStr = item.id.toString()
    
    // Check for ID match (exact or prefix)
    if (idStr === q || idStr.startsWith(q)) {
      idMatches.push(item)
      continue
    }
    
    // Skip items without names for text search
    if (!item.name) continue
    
    if (name === q) {
      exact.push(item)
    } else if (name.startsWith(q)) {
      prefix.push(item)
    } else if (name.includes(q)) {
      contains.push(item)
    }
  }
  
  // Combine results in priority order
  const results = [...exact, ...prefix, ...contains, ...idMatches]
  
  // Remove duplicates and limit results
  const seen = new Set<number>()
  const unique = results.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  
  return unique.slice(0, take)
}
