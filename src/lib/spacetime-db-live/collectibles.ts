import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import type { CollectibleType } from '@/data/bindings/collectible_type_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { Rarity } from '@/data/bindings/rarity_type'
import collectibleDescData from '@/data/global/collectible_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Combined collectible data with item information and computed properties
export interface CollectibleWithItem extends CollectibleDesc {
  item: ItemDesc
  collectibleTypeName: string
  collectibleRarityName: string
  isClothing: boolean
  isAutoCollectable: boolean
  isLocked: boolean
  hasKnowledgeRequirements: boolean
  canBeEquipped: boolean
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
 * Get collectible type name from CollectibleType
 */
function getCollectibleTypeName(collectibleType: unknown): string {
  if (typeof collectibleType === 'object' && collectibleType !== null && 'tag' in collectibleType) {
    return (collectibleType as CollectibleType).tag
  }
  return 'Unknown'
}

/**
 * Get collectible rarity name from Rarity  
 */
function getCollectibleRarityName(rarity: unknown): string {
  if (typeof rarity === 'object' && rarity !== null && 'tag' in rarity) {
    return (rarity as Rarity).tag
  }
  return 'Unknown'
}

/**
 * Check if collectible type is clothing-related
 */
function isClothingType(typeName: string): boolean {
  const clothingTypes = [
    'ClothesHead', 'ClothesBelt', 'ClothesTorso', 
    'ClothesArms', 'ClothesLegs', 'ClothesFeet', 'ClothesCape'
  ]
  return clothingTypes.includes(typeName)
}

/**
 * Alias for getCollectiblesWithStats for consistency with other modules
 */
export async function getCollectiblesWithItems(): Promise<CollectibleWithItem[]> {
  return getCollectiblesWithStats()
}

/**
 * Combine collectible items with their stats and computed properties
 */
export async function getCollectiblesWithStats(): Promise<CollectibleWithItem[]> {
  const { itemDesc, collectibleDesc } = getCollectibleData()

  const collectibleItems = itemDesc.filter((item) => {
    const collectibleItemIds = new Set(collectibleDesc.map((collectible) => collectible.itemDeedId))
    return item.compendiumEntry && collectibleItemIds.has(item.id)
  })

  const results: CollectibleWithItem[] = []

  for (const item of collectibleItems) {
    const collectibleData = collectibleDesc.find((collectible) => collectible.itemDeedId === item.id)
    if (collectibleData) {
      // Get type and rarity names with proper typing
      const collectibleTypeName = getCollectibleTypeName(collectibleData.collectibleType)
      const collectibleRarityName = getCollectibleRarityName(collectibleData.collectibleRarity)
      
      // Calculate computed properties
      const isClothing = isClothingType(collectibleTypeName)
      const isAutoCollectable = collectibleData.autoCollect
      const isLocked = collectibleData.locked
      const hasKnowledgeRequirements = 
        collectibleData.requiredKnowledgesToUse.length > 0 || 
        collectibleData.requiredKnowledgesToConvert.length > 0
      const canBeEquipped = collectibleData.maxEquipCount > 0

      results.push({
        ...collectibleData,
        item,
        collectibleTypeName,
        collectibleRarityName,
        isClothing,
        isAutoCollectable,
        isLocked,
        hasKnowledgeRequirements,
        canBeEquipped
      })
    }
  }

  return results
}

/**
 * Get collectibles grouped by tag, sorted by tier then by rarity
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

  // Sort each group by tier, then by rarity, then by name
  for (const tag in grouped) {
    grouped[tag].sort((a, b) => {
      // First sort by tier
      if (a.item.tier !== b.item.tier) {
        return a.item.tier - b.item.tier
      }
      // Then sort by rarity name
      if (a.collectibleRarityName !== b.collectibleRarityName) {
        return a.collectibleRarityName.localeCompare(b.collectibleRarityName)
      }
      // Finally sort by name
      return a.item.name.localeCompare(b.item.name)
    })
  }

  return grouped
}

/**
 * Get collectibles grouped by collectible type
 */
export async function getCollectiblesGroupedByType(): Promise<Record<string, CollectibleWithItem[]>> {
  const collectibles = await getCollectiblesWithStats()

  const grouped: Record<string, CollectibleWithItem[]> = {}

  for (const collectible of collectibles) {
    const typeName = collectible.collectibleTypeName
    if (!grouped[typeName]) {
      grouped[typeName] = []
    }
    grouped[typeName].push(collectible)
  }

  // Sort each group by tier, then by rarity, then by name
  for (const typeName in grouped) {
    grouped[typeName].sort((a, b) => {
      // First sort by tier
      if (a.item.tier !== b.item.tier) {
        return a.item.tier - b.item.tier
      }
      // Then sort by rarity name
      if (a.collectibleRarityName !== b.collectibleRarityName) {
        return a.collectibleRarityName.localeCompare(b.collectibleRarityName)
      }
      // Finally sort by name
      return a.item.name.localeCompare(b.item.name)
    })
  }

  return grouped
}

/**
 * Get collectibles grouped by rarity
 */
export async function getCollectiblesGroupedByRarity(): Promise<Record<string, CollectibleWithItem[]>> {
  const collectibles = await getCollectiblesWithStats()

  const grouped: Record<string, CollectibleWithItem[]> = {}

  for (const collectible of collectibles) {
    const rarity = collectible.collectibleRarityName
    if (!grouped[rarity]) {
      grouped[rarity] = []
    }
    grouped[rarity].push(collectible)
  }

  // Sort each group by type, then by tier, then by name
  for (const rarity in grouped) {
    grouped[rarity].sort((a, b) => {
      // First sort by collectible type
      if (a.collectibleTypeName !== b.collectibleTypeName) {
        return a.collectibleTypeName.localeCompare(b.collectibleTypeName)
      }
      // Then sort by tier
      if (a.item.tier !== b.item.tier) {
        return a.item.tier - b.item.tier
      }
      // Finally sort by name
      return a.item.name.localeCompare(b.item.name)
    })
  }

  return grouped
}

/**
 * Get collectibles grouped by clothing vs non-clothing
 */
export async function getCollectiblesGroupedByCategory(): Promise<Record<string, CollectibleWithItem[]>> {
  const collectibles = await getCollectiblesWithStats()

  const grouped: Record<string, CollectibleWithItem[]> = {
    'Clothing & Wearables': [],
    'Other Collectibles': []
  }

  for (const collectible of collectibles) {
    const category = collectible.isClothing ? 'Clothing & Wearables' : 'Other Collectibles'
    grouped[category].push(collectible)
  }

  // Sort each group by type, then by tier, then by name
  for (const category in grouped) {
    grouped[category].sort((a, b) => {
      // First sort by collectible type
      if (a.collectibleTypeName !== b.collectibleTypeName) {
        return a.collectibleTypeName.localeCompare(b.collectibleTypeName)
      }
      // Then sort by tier
      if (a.item.tier !== b.item.tier) {
        return a.item.tier - b.item.tier
      }
      // Finally sort by name
      return a.item.name.localeCompare(b.item.name)
    })
  }

  return grouped
}

/**
 * Get collectible statistics overview with enhanced analysis
 */
export async function getCollectibleStatistics() {
  const collectibles = await getCollectiblesWithStats()
  const collectiblesByTag = await getCollectiblesGroupedByTag()
  const collectiblesByType = await getCollectiblesGroupedByType()
  const collectiblesByRarity = await getCollectiblesGroupedByRarity()
  const collectiblesByCategory = await getCollectiblesGroupedByCategory()

  const totalCollectibles = collectibles.length
  const tagCount = Object.keys(collectiblesByTag).length
  const typeCount = Object.keys(collectiblesByType).length

  // Calculate tier distribution
  const tierDistribution: Record<number, number> = {}
  collectibles.forEach((collectible) => {
    tierDistribution[collectible.item.tier] = (tierDistribution[collectible.item.tier] || 0) + 1
  })

  // Calculate collectible rarity distribution (from CollectibleDesc, not ItemDesc)
  const collectibleRarityDistribution: Record<string, number> = {}
  collectibles.forEach((collectible) => {
    collectibleRarityDistribution[collectible.collectibleRarityName] = 
      (collectibleRarityDistribution[collectible.collectibleRarityName] || 0) + 1
  })

  // Calculate item rarity distribution (from ItemDesc for comparison)
  const itemRarityDistribution: Record<string, number> = {}
  collectibles.forEach((collectible) => {
    const rarity = collectible.item.rarity?.tag || 'Unknown'
    itemRarityDistribution[rarity] = (itemRarityDistribution[rarity] || 0) + 1
  })

  // Calculate type distribution
  const typeDistribution: Record<string, number> = {}
  collectibles.forEach((collectible) => {
    typeDistribution[collectible.collectibleTypeName] = 
      (typeDistribution[collectible.collectibleTypeName] || 0) + 1
  })

  // Calculate characteristic counts
  const clothingCollectibles = collectibles.filter(c => c.isClothing).length
  const autoCollectibles = collectibles.filter(c => c.isAutoCollectable).length
  const lockedCollectibles = collectibles.filter(c => c.isLocked).length
  const collectiblesWithKnowledge = collectibles.filter(c => c.hasKnowledgeRequirements).length
  const equipableCollectibles = collectibles.filter(c => c.canBeEquipped).length

  // Calculate max equip count statistics
  const maxEquipCounts = collectibles.map(c => c.maxEquipCount)
  const maxEquipStats = maxEquipCounts.length > 0 ? {
    minEquipCount: Math.min(...maxEquipCounts),
    maxEquipCount: Math.max(...maxEquipCounts),
    avgEquipCount: Math.round((maxEquipCounts.reduce((sum, count) => sum + count, 0) / maxEquipCounts.length) * 100) / 100
  } : {
    minEquipCount: 0,
    maxEquipCount: 0,
    avgEquipCount: 0
  }

  return {
    total: totalCollectibles,
    tags: tagCount,
    types: typeCount,
    clothingCollectibles,
    autoCollectibles,
    lockedCollectibles,
    collectiblesWithKnowledge,
    equipableCollectibles,
    tierDistribution,
    collectibleRarityDistribution,
    itemRarityDistribution,
    typeDistribution,
    maxEquipStats,
    collectiblesByTag: Object.entries(collectiblesByTag).map(([tag, collectibleList]) => ({
      tag,
      count: collectibleList.length,
      clothingCount: collectibleList.filter(c => c.isClothing).length
    })),
    collectiblesByType: Object.entries(collectiblesByType).map(([type, collectibleList]) => ({
      type,
      count: collectibleList.length,
      isClothingType: collectibleList[0]?.isClothing ?? false
    })),
    collectiblesByRarity: Object.entries(collectiblesByRarity).map(([rarity, collectibleList]) => ({
      rarity,
      count: collectibleList.length
    })),
    collectiblesByCategory: Object.entries(collectiblesByCategory).map(([category, collectibleList]) => ({
      category,
      count: collectibleList.length
    }))
  }
}
