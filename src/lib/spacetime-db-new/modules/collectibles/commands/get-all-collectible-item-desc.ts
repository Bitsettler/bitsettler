import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import collectibleDescData from '@/data/sdk-tables/collectible_desc.json'
import itemDescData from '@/data/sdk-tables/item_desc.json'

/**
 * Get all collectible items
 */
export function getCollectibleItems(): ItemDesc[] {
  const itemDesc = itemDescData as ItemDesc[]
  const collectibleDesc = collectibleDescData as CollectibleDesc[]

  const collectibleItemIds = new Set(collectibleDesc.map((collectible) => collectible.itemDeedId))

  return itemDesc.filter((item) => item.compendiumEntry && collectibleItemIds.has(item.id))
}
