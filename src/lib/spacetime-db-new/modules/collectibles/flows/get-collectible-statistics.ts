import { getCollectiblesForCompendium } from './get-collectibles-for-compendium'

export interface CollectibleStatistics {
  total: number
  types: number
}

/**
 * Get collectible statistics for compendium
 */
export function getCollectibleStatistics(): CollectibleStatistics {
  const collectibles = getCollectiblesForCompendium()
  const types = new Set(collectibles.map((item) => item.collectible.collectibleType.tag))

  return {
    total: collectibles.length,
    types: types.size
  }
}
