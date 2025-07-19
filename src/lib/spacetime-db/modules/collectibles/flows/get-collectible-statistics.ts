import { getCollectiblesWithStats } from './get-collectibles-with-stats'

export interface CollectibleStatistics {
  total: number
  groupedByTag: Record<string, number>
  groupedByRarity: Record<string, number>
  groupedByType: Record<string, number>
}

/**
 * Get statistics about collectibles
 */
export function getCollectibleStatistics(): CollectibleStatistics {
  const collectibles = getCollectiblesWithStats()
  
  const groupedByTag: Record<string, number> = {}
  const groupedByRarity: Record<string, number> = {}
  const groupedByType: Record<string, number> = {}

  for (const collectible of collectibles) {
    // Count by tag
    const tag = collectible.item.tag
    groupedByTag[tag] = (groupedByTag[tag] || 0) + 1

    // Count by rarity
    const rarity = collectible.item.rarity?.toString() || 'Unknown'
    groupedByRarity[rarity] = (groupedByRarity[rarity] || 0) + 1

    // Count by type
    const type = collectible.item.tag
    groupedByType[type] = (groupedByType[type] || 0) + 1
  }

  return {
    total: collectibles.length,
    groupedByTag,
    groupedByRarity,
    groupedByType
  }
}