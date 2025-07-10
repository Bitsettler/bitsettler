import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'

/**
 * Union type for all compendium entities
 */
export type CompendiumEntity =
  | (ItemDesc & { entityType: 'item' })
  | (CargoDesc & { entityType: 'cargo' })
  | (ResourceDesc & { entityType: 'resource' })

/**
 * Base entity type that all compendium entities share
 */
export type BaseEntity = {
  id: number
  name: string
  description: string
  iconAssetName: string
  tier: number
  tag: string
  rarity: [number, Record<string, unknown>]
  compendiumEntry: boolean
}

/**
 * Entity type enum
 */
export type EntityType = 'item' | 'cargo' | 'resource'
