import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import collectibleDescData from '@/data/global/collectible_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import { camelCaseDeep } from '../../../shared/utils/case-utils'

/**
 * Get collectible-related data from static JSON files
 */
export function getCollectibleData() {
  return {
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    collectibleDesc: camelCaseDeep<CollectibleDesc[]>(collectibleDescData)
  }
}

/**
 * Get all collectible items
 */
export function getCollectibleItems(): ItemDesc[] {
  const { itemDesc, collectibleDesc } = getCollectibleData()
  const collectibleItemIds = new Set(collectibleDesc.map((collectible) => collectible.itemDeedId))

  return itemDesc.filter((item) => item.compendiumEntry && collectibleItemIds.has(item.id))
}

/**
 * Get all collectible stats
 */
export function getCollectibleStats(): CollectibleDesc[] {
  const { collectibleDesc } = getCollectibleData()
  return collectibleDesc
}
