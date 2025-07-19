import type { ItemDesc } from '@/data/bindings/item_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'

// Convert snake_case JSON to camelCase and type properly
const items = camelCaseDeep<ItemDesc[]>(itemDescData)

/**
 * Get all items
 */
export function getAllItems(): ItemDesc[] {
  return items
}