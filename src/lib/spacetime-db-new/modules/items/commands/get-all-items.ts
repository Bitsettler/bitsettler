import type { ItemDesc } from '@/data/bindings/item_desc_type'
import itemDescData from '@/data/sdk-tables/item_desc.json'

// SDK data is already in camelCase format, no transformation needed
const items = itemDescData as ItemDesc[]

/**
 * Get all items from SDK data
 */
export function getAllItems(): ItemDesc[] {
  return items
}