import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getCollectibleItems, getCollectibleStats } from '../commands'

export interface CollectibleWithItem {
  item: ItemDesc
  stats: CollectibleDesc
}

/**
 * Get collectibles with their associated stats
 */
export function getCollectiblesWithStats(): CollectibleWithItem[] {
  const items = getCollectibleItems()
  const stats = getCollectibleStats()
  const statsById = new Map(stats.map((stat) => [stat.itemDeedId, stat]))

  return items.map((item) => ({
    item,
    stats: statsById.get(item.id)!
  })).filter((collectible) => collectible.stats)
}

/**
 * Get collectibles with their associated items (alias for backward compatibility)
 */
export function getCollectiblesWithItems(): CollectibleWithItem[] {
  return getCollectiblesWithStats()
}