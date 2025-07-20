import { getAllItems } from './get-all-items'

/**
 * Get all unique consumable tags from SDK data
 */
export function getAllConsumableTags(): string[] {
  // Consumable tags based on the old collections
  const consumableTags = new Set([
    'Basic Food', 'Bandage', 'Bait', 'Berry', 'Chum', 'Citric Berry', 
    'Crafting Speed Elixir', 'Healing Potion', 'Meal', 'Mushroom', 
    'Raw Meal', 'Recipe', 'Stamina Potion', 'Sugar', 'Tea', 'Vegetable', 
    'Wonder Fruit'
  ])

  const items = getAllItems()
  const actualTags = new Set<string>()
  
  items.forEach(item => {
    if (item.tag && consumableTags.has(item.tag)) {
      actualTags.add(item.tag)
    }
  })
  
  return Array.from(actualTags).sort()
}