import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { createSlug } from '../../../shared/utils/entities'
import { getAllItems } from './get-all-items'

/**
 * Get item by slug command - returns a single item by its slug
 */
export function getItemBySlugCommand(slug: string): ItemDesc | null {
  const items = getAllItems()

  // Find item by comparing slugified names
  const item = items.find((item) => createSlug(item.name) === slug)

  return item || null
}
