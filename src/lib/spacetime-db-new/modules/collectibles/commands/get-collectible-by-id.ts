import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import { getAllCollectibles } from './get-all-collectibles'

/**
 * Get a specific collectible by its ID
 */
export function getCollectibleById(id: number): CollectibleDesc | undefined {
  const collectibles = getAllCollectibles()
  return collectibles.find((collectible) => collectible.id === id)
}