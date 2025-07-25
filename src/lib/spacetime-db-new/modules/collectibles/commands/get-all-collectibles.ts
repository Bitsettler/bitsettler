import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import collectibleDescData from '@/data/sdk-tables/collectible_desc.json'

const collectibles = collectibleDescData as CollectibleDesc[]

/**
 * Get all collectibles from SDK data
 */
export function getAllCollectibles(): CollectibleDesc[] {
  return collectibles
}