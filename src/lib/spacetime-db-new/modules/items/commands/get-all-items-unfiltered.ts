import type { ItemDesc } from '@/data/bindings/item_desc_type'
import itemDescData from '@/data/sdk-tables/item_desc.json'

const items = itemDescData as ItemDesc[]

/**
 * Get all items without any filtering (for calculator use)
 */
export function getAllItemsUnfiltered(): ItemDesc[] {
  return items
}