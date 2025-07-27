import type { CollectibleDesc } from '@/data/bindings/collectible_desc_type'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getAllCollectibles } from './get-all-collectibles'

/**
 * Get collectibles filtered by multiple collectible type slugs
 */
export function getCollectiblesByTypeSlugs(
  typeSlugs: string[]
): CollectibleDesc[] {
  const collectibles = getAllCollectibles()
  return collectibles.filter((collectible) => {
    const typeSlug = createSlug(collectible.collectibleType.tag)
    return typeSlugs.includes(typeSlug)
  })
}
