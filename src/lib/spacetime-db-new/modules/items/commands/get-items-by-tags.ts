import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getAllItems } from './get-all-items'

/**
 * Get items filtered by specific tags
 */
export function getItemsByTags(tags: readonly string[]): ItemDesc[] {
  const allItems = getAllItems()
  return allItems.filter((item) => 
    item.tag && 
    tags.includes(item.tag) && 
    item.compendiumEntry
  )
}