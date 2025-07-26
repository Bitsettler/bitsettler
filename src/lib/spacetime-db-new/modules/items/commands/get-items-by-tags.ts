import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getAllItems } from './get-all-items'

/**
 * Get items filtered by specific tags
 */
export function getItemsByTags(tags: readonly string[]): ItemDesc[] {
  const allItems = getAllItems()
  return allItems.filter((item) => item.tag && tags.includes(item.tag) && item.compendiumEntry)
}

export function getItemsByTagSlugs(tagSlugs: string[]): ItemDesc[] {
  const allItems = getAllItems()
  return allItems.filter((item) => item.tag && tagSlugs.includes(createSlug(item.tag)) && item.compendiumEntry)
}
