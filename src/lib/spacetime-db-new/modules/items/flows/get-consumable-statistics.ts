import { getAllConsumables } from '../commands/get-all-consumables'

interface ConsumableStatistics {
  total: number
  uniqueTags: number
}

/**
 * Get comprehensive statistics about consumable items
 */
export function getConsumableStatistics(): ConsumableStatistics {
  const consumables = getAllConsumables()

  const uniqueTags = new Set(consumables.map((c) => c.tag).filter(Boolean)).size

  return {
    total: consumables.length,
    uniqueTags
  }
}
