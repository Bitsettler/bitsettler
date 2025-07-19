import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getAllItems } from './get-all-items'
import { ItemTag } from '../item-tags'

/**
 * Get items filtered by specific tags
 */
export function getItemsByTags(tags: readonly ItemTag[]): ItemDesc[] {
  const allItems = getAllItems()
  return allItems.filter((item) => 
    tags.includes(item.tag as ItemTag) && item.compendiumEntry
  )
}