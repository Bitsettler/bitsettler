import { getResourcesInCompendium } from '../commands'

interface ResourceStatistics {
  total: number
  uniqueTags: number
}

/**
 * Get comprehensive statistics about resources in the compendium
 */
export function getResourceStatistics(): ResourceStatistics {
  const resources = getResourcesInCompendium()

  const uniqueTags = new Set(resources.map((r) => r.tag).filter(Boolean)).size

  return {
    total: resources.length,
    uniqueTags
  }
}
