import rawCollectibles from '@/data/global/collectible_desc.json'
import rawItems from '@/data/global/item_desc.json'
import { camelCaseDeep } from '../../utils/case-utils'
import { cleanIconAssetName, getServerIconPath } from '../assets'

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

/**
 * Get the correct icon path for a collectible deed item.
 * If the item is a collectible deed, looks up the associated collectible's icon.
 * Otherwise, falls back to the standard item icon logic.
 */
export function getCollectibleIconPath(item: { id: number; iconAssetName?: string }): string {
  // Convert datasets to camelCase to match binding types
  const collectibles = camelCaseDeep<CollectibleDesc[]>(rawCollectibles)
  
  // Find collectible that references this item as its deed
  const collectible = collectibles.find((col) => col.itemDeedId === item.id)
  
  if (collectible && collectible.iconAssetName) {
    // Use the collectible's icon asset name (which has the correct cosmetic paths)
    return getServerIconPath(cleanIconAssetName(collectible.iconAssetName))
  }
  
  // Fall back to the item's own icon asset name with standard processing
  return getServerIconPath(cleanIconAssetName(item.iconAssetName || ''))
}
