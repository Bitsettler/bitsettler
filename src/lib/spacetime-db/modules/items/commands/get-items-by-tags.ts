import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { ItemTag } from '../item-tags'
import { getAllItems } from './get-all-items'

/**
 * Get items filtered by specific tags
 */
export function getItemsByTags(tags: readonly ItemTag[]): ItemDesc[] {
  const allItems = getAllItems()
  return allItems.filter((item) => tags.includes(item.tag as ItemTag) && item.compendiumEntry)
}
