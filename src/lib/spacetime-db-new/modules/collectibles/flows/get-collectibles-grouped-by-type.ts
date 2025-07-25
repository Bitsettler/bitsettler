import { getCollectiblesForCompendium } from './get-collectibles-for-compendium'
import type { CollectibleWithDeed } from './get-collectibles-with-deeds'

export interface CollectibleGroup {
  name: string
  slug: string
  collectibles: CollectibleWithDeed[]
  count: number
  iconAssetName: string
}

/**
 * Get collectibles grouped by collectible type
 */
export function getCollectiblesGroupedByType(): CollectibleGroup[] {
  const collectibles = getCollectiblesForCompendium()

  const groups = new Map<string, CollectibleWithDeed[]>()

  collectibles.forEach((item) => {
    const type = item.collectible.collectibleType.tag
    if (!groups.has(type)) {
      groups.set(type, [])
    }
    groups.get(type)!.push(item)
  })

  return Array.from(groups.entries()).map(([type, items]) => ({
    name: type,
    slug: type.toLowerCase().replace(/\s+/g, '-'),
    collectibles: items,
    count: items.length,
    iconAssetName: items[0]?.collectible?.iconAssetName || items[0]?.deed?.iconAssetName || 'Items/AncientDeed'
  }))
}
