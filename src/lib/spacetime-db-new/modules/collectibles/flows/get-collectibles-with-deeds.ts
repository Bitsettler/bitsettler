import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getAllCollectibles, getCollectibleDeedById } from '../commands'

export interface CollectibleWithDeed {
  collectible: CollectibleDesc
  deed: ItemDesc | undefined
}

/**
 * Get collectibles with their associated deed items
 */
export function getCollectiblesWithDeeds(): CollectibleWithDeed[] {
  const collectibles = getAllCollectibles()

  return collectibles.map((collectible) => ({
    collectible,
    deed: getCollectibleDeedById(collectible.itemDeedId)
  }))
}
