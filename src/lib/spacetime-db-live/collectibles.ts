import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import collectibleDescData from '@/data/global/collectible_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Combined collectible data with item information
export interface CollectibleWithItem extends CollectibleDesc {
  item: ItemDesc
}

/**
 * Get collectible-related data from static JSON files
 */
function getCollectibleData() {
  return {
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    collectibleDesc: camelCaseDeep<CollectibleDesc[]>(collectibleDescData)
  }
}

/**
 * Get all collectible items from live data
 */
export async function getCollectibleItems(): Promise<ItemDesc[]> {
  const { itemDesc, collectibleDesc } = getCollectibleData()
  const collectibleItemIds = new Set(collectibleDesc.map((collectible) => collectible.itemDeedId))

  return itemDesc.filter((item) => item.compendiumEntry && collectibleItemIds.has(item.id))
}

/**
 * Get all collectible stats from live data
 */
export async function getCollectibleStats(): Promise<CollectibleDesc[]> {
  const { collectibleDesc } = getCollectibleData()
  return collectibleDesc
}

/**
 * Alias for getCollectiblesWithStats for consistency with other modules
 */
export async function getCollectiblesWithItems(): Promise<CollectibleWithItem[]> {
  return getCollectiblesWithStats()
}

/**
 * Combine collectible items with their stats
 */
export async function getCollectiblesWithStats(): Promise<CollectibleWithItem[]> {
  const { itemDesc, collectibleDesc } = getCollectibleData()

  const collectibleItems = itemDesc.filter((item) => {
    const collectibleItemIds = new Set(collectibleDesc.map((collectible) => collectible.itemDeedId))
    return item.compendiumEntry && collectibleItemIds.has(item.id)
  })

  const results: CollectibleWithItem[] = []

  for (const item of collectibleItems) {
    const stats = collectibleDesc.find((stat) => stat.itemDeedId === item.id)
    if (stats) {
      results.push({
        ...stats,
        item
      })
    }
  }

  return results
}

/**
 * Get collectibles grouped by tag, sorted by tier
 */
export async function getCollectiblesGroupedByTag(): Promise<Record<string, CollectibleWithItem[]>> {
  const collectibles = await getCollectiblesWithStats()

  const grouped: Record<string, CollectibleWithItem[]> = {}

  for (const collectible of collectibles) {
    const tag = collectible.item.tag
    if (!grouped[tag]) {
      grouped[tag] = []
    }
    grouped[tag].push(collectible)
  }

  // Sort each group by tier
  for (const tag in grouped) {
    grouped[tag].sort((a, b) => a.item.tier - b.item.tier)
  }

  return grouped
}

/**
 * Get collectible statistics overview
 */
export async function getCollectibleStatistics() {
  const collectibles = await getCollectiblesWithStats()
  const collectiblesByTag = await getCollectiblesGroupedByTag()

  const totalCollectibles = collectibles.length
  const tagCount = Object.keys(collectiblesByTag).length

  const tierDistribution: Record<number, number> = {}
  collectibles.forEach((collectible) => {
    tierDistribution[collectible.item.tier] = (tierDistribution[collectible.item.tier] || 0) + 1
  })

  const rarityDistribution: Record<string, number> = {}
  collectibles.forEach((collectible) => {
    const rarity = collectible.item.rarity?.tag || 'Unknown'
    rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1
  })

  return {
    total: totalCollectibles,
    tags: tagCount,
    tierDistribution,
    rarityDistribution,
    collectiblesByTag: Object.entries(collectiblesByTag).map(([tag, collectibles]) => ({
      tag,
      count: collectibles.length
    }))
  }
}
