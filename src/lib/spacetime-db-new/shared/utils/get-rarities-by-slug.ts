import { getAllItems } from '@/lib/spacetime-db-new/modules/items/commands/get-all-items'
import { createSlug } from './entities'

// Rarity order from the Rarity namespace - this is the display order
const RARITY_ORDER = ['Default', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const
type RarityTag = typeof RARITY_ORDER[number]

/**
 * Get all available rarities for an item by its slug
 * Returns an array of rarity strings sorted by rarity order
 */
export function getRaritiesBySlug(slug: string): string[] {
  const allItems = getAllItems()
  
  // Find all items with matching slugs (same name, different rarities)
  const matchingItems = allItems.filter((item) => {
    const itemSlug = createSlug(item.name)
    return itemSlug === slug
  })

  // Extract unique rarities
  const rarities = [...new Set(matchingItems.map((item) => item.rarity.tag))]

  // Sort by rarity order
  return rarities.sort((a, b) => {
    const aIndex = RARITY_ORDER.indexOf(a as RarityTag)
    const bIndex = RARITY_ORDER.indexOf(b as RarityTag)
    return aIndex - bIndex
  })
}