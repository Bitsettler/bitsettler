import type { ItemListDesc } from '@/data/bindings/item_list_desc_type'
import itemListDescData from '@/data/sdk-tables/item_list_desc.json'

/**
 * Get all item lists
 */
export function getAllItemLists(): ItemListDesc[] {
  return itemListDescData as ItemListDesc[]
}
