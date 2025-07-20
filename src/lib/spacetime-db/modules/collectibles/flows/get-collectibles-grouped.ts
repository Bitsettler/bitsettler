import { getCollectiblesWithStats, type CollectibleWithItem } from './get-collectibles-with-stats'

/**
 * Group collectibles by tag
 */
export function getCollectiblesGroupedByTag(): Record<string, CollectibleWithItem[]> {
  const collectibles = getCollectiblesWithStats()
  const grouped: Record<string, CollectibleWithItem[]> = {}

  for (const collectible of collectibles) {
    const tag = collectible.item.tag
    if (!grouped[tag]) {
      grouped[tag] = []
    }
    grouped[tag].push(collectible)
  }

  return grouped
}

/**
 * Group collectibles by type (using tag as type)
 */
export function getCollectiblesGroupedByType(): Record<string, CollectibleWithItem[]> {
  const collectibles = getCollectiblesWithStats()
  const grouped: Record<string, CollectibleWithItem[]> = {}

  for (const collectible of collectibles) {
    const type = collectible.item.tag
    if (!grouped[type]) {
      grouped[type] = []
    }
    grouped[type].push(collectible)
  }

  return grouped
}

/**
 * Group collectibles by rarity
 */
export function getCollectiblesGroupedByRarity(): Record<string, CollectibleWithItem[]> {
  const collectibles = getCollectiblesWithStats()
  const grouped: Record<string, CollectibleWithItem[]> = {}

  for (const collectible of collectibles) {
    const rarity = collectible.item.rarity?.toString() || 'Unknown'
    if (!grouped[rarity]) {
      grouped[rarity] = []
    }
    grouped[rarity].push(collectible)
  }

  return grouped
}

/**
 * Group collectibles by category
 */
export function getCollectiblesGroupedByCategory(): Record<string, CollectibleWithItem[]> {
  const collectibles = getCollectiblesWithStats()
  const grouped: Record<string, CollectibleWithItem[]> = {}

  for (const collectible of collectibles) {
    const category = collectible.item.tier.toString()
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(collectible)
  }

  return grouped
}
