import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import type { CompendiumEntity, EntityType } from './types'

/**
 * Convert server entities to unified compendium format
 */
export function convertToCompendiumEntity<T extends ItemDesc | CargoDesc | ResourceDesc>(
  entity: T,
  entityType: EntityType
): CompendiumEntity {
  return {
    ...entity,
    entityType
  } as CompendiumEntity
}

/**
 * Create a slug from a name
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Filter entities by category
 */
export function filterByCategory(entities: CompendiumEntity[], category: string): CompendiumEntity[] {
  return entities.filter((entity) => entity.tag === category)
}

/**
 * Filter entities by search term
 */
export function filterBySearch(entities: CompendiumEntity[], searchTerm: string): CompendiumEntity[] {
  if (!searchTerm.trim()) return entities

  const term = searchTerm.toLowerCase()
  return entities.filter(
    (entity) =>
      entity.name.toLowerCase().includes(term) ||
      entity.description.toLowerCase().includes(term) ||
      entity.tag.toLowerCase().includes(term)
  )
}

/**
 * Filter entities by entity type
 */
export function filterByEntityType(entities: CompendiumEntity[], entityType: EntityType): CompendiumEntity[] {
  return entities.filter((entity) => entity.entityType === entityType)
}

/**
 * Filter entities by tier range
 */
export function filterByTierRange(entities: CompendiumEntity[], minTier: number, maxTier: number): CompendiumEntity[] {
  return entities.filter((entity) => entity.tier >= minTier && entity.tier <= maxTier)
}

/**
 * Filter entities by rarity
 */
export function filterByRarity(entities: CompendiumEntity[], rarity: string): CompendiumEntity[] {
  return entities.filter((entity) => {
    // Handle rarity as array format [number, {}] from JSON data
    const rarityArray = entity.rarity as unknown as [number, Record<string, unknown>]
    const [rarityIndex] = rarityArray
    const rarityMap: Record<number, string> = {
      0: 'default',
      1: 'common',
      2: 'uncommon',
      3: 'rare',
      4: 'epic',
      5: 'legendary',
      6: 'mythic'
    }
    return rarityMap[rarityIndex] === rarity.toLowerCase()
  })
}

/**
 * Sort entities by name
 */
export function sortEntitiesByName(entities: CompendiumEntity[]): CompendiumEntity[] {
  return [...entities].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Sort entities by tier
 */
export function sortEntitiesByTier(entities: CompendiumEntity[]): CompendiumEntity[] {
  return [...entities].sort((a, b) => a.tier - b.tier)
}

/**
 * Sort entities by rarity
 */
export function sortEntitiesByRarity(entities: CompendiumEntity[]): CompendiumEntity[] {
  return [...entities].sort((a, b) => {
    // Handle rarity as array format [number, {}] from JSON data
    const rarityArrayA = a.rarity as unknown as [number, Record<string, unknown>]
    const rarityArrayB = b.rarity as unknown as [number, Record<string, unknown>]
    const [rarityA] = rarityArrayA
    const [rarityB] = rarityArrayB
    return rarityA - rarityB
  })
}

/**
 * Get entity tier color classes
 */
export function getTierColor(tier: number): string {
  if (tier === -1) return 'bg-gray-100 text-gray-800 border-gray-300' // #74787e grey
  if (tier === 1) return 'bg-gray-100 text-gray-800 border-gray-300' // #5b4e52 dark grey
  if (tier === 2) return 'bg-orange-100 text-orange-800 border-orange-300' // #c97958 brown
  if (tier === 3) return 'bg-lime-100 text-lime-800 border-lime-300' // #b4fe79 lime green
  if (tier === 4) return 'bg-sky-100 text-sky-800 border-sky-300' // #61c4ee skyblue
  if (tier === 5) return 'bg-purple-100 text-purple-800 border-purple-300' // #6c57ff purple
  if (tier === 6) return 'bg-red-100 text-red-800 border-red-300' // #cf1a32 red
  if (tier === 7) return 'bg-yellow-100 text-yellow-800 border-yellow-300' // #eeda4a yellow
  if (tier === 8) return 'bg-cyan-100 text-cyan-800 border-cyan-300' // #96ffe0 neon blue
  if (tier === 9) return 'bg-gray-800 text-gray-100 border-gray-300' // #42474e black
  if (tier === 10) return 'bg-gray-50 text-cyan-800 border-cyan-200' // #f4feff very pale cyan, almost white
  return 'bg-gray-100 text-gray-800 border-gray-300' // fallback for other tiers
}

/**
 * Get unique entity types from entities
 */
export function extractUniqueEntityTypes(entities: CompendiumEntity[]): EntityType[] {
  const types = new Set<EntityType>()
  entities.forEach((entity) => {
    types.add(entity.entityType)
  })
  return Array.from(types).sort()
}

/**
 * Get entity statistics
 */
export function getEntityStats(entities: CompendiumEntity[]): {
  total: number
  byType: Record<EntityType, number>
  byTier: Record<number, number>
  averageTier: number
} {
  const byType: Record<EntityType, number> = { item: 0, cargo: 0, resource: 0 }
  const byTier: Record<number, number> = {}
  let totalTier = 0

  entities.forEach((entity) => {
    byType[entity.entityType]++
    byTier[entity.tier] = (byTier[entity.tier] || 0) + 1
    totalTier += entity.tier
  })

  return {
    total: entities.length,
    byType,
    byTier,
    averageTier: entities.length > 0 ? Math.round(totalTier / entities.length) : 0
  }
}
