import { getAllItems } from '../commands/get-all-items'

interface ItemStatistics {
  total: number
  uniqueTags: number
}

/**
 * Get comprehensive statistics about all items
 */
export function getItemStatistics(): ItemStatistics {
  const items = getAllItems()

  const uniqueTags = new Set(items.map((item) => item.tag).filter(Boolean)).size

  return {
    total: items.length,
    uniqueTags
  }
}