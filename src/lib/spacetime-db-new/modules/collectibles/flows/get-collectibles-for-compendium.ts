import type { CollectibleWithDeed } from './get-collectibles-with-deeds'
import { getCollectiblesWithDeeds } from './get-collectibles-with-deeds'

/**
 * Get collectibles with deeds that have compendium entries
 */
export function getCollectiblesForCompendium(): CollectibleWithDeed[] {
  const collectiblesWithDeeds = getCollectiblesWithDeeds()

  return collectiblesWithDeeds.filter(
    (item) => item.deed && item.deed.compendiumEntry
  )
}
