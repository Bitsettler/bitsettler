import type { ItemListDesc } from '@/data/bindings/item_list_desc_type'
import itemListDescData from '@/data/global/item_list_desc.json'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'

// Convert snake_case JSON to camelCase and type properly
const itemLists = camelCaseDeep<ItemListDesc[]>(itemListDescData)

/**
 * Get all item lists
 */
export function getAllItemLists(): ItemListDesc[] {
  return itemLists
}
