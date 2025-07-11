import rawCollectibles from '@/data/global/collectible_desc.json'
import rawItems from '@/data/global/item_desc.json'
import { camelCaseDeep } from '../utils/case-utils'

import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'

/**
 * Return collectibles whose associated deed item exists in the compendium.
 * A collectible object references an item via `itemDeedId` (or snake_case in JSON).
 */
export function getAllCollectibles(): CollectibleDesc[] {
  // Convert both datasets to camelCase so they match binding types
  const collectibles = camelCaseDeep<CollectibleDesc[]>(rawCollectibles)
  const items = camelCaseDeep<ItemDesc[]>(rawItems)

  const itemMap = new Map<number, ItemDesc>()
  items.forEach((it) => itemMap.set(it.id, it))

  return collectibles.filter((col) => {
    const deedItem = itemMap.get(col.itemDeedId)
    return deedItem?.compendiumEntry === true
  })
}
