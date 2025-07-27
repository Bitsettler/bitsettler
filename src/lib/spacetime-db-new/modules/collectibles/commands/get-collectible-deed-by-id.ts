import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getAllItems } from '../../items/commands/get-all-items'

/**
 * Get the deed item for a collectible by itemDeedId
 */
export function getCollectibleDeedById(
  itemDeedId: number
): ItemDesc | undefined {
  const items = getAllItems()
  return items.find((item) => item.id === itemDeedId)
}
