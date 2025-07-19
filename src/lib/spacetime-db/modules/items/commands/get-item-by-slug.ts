import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getAllItems } from './get-all-items'
import { createSlug } from '../../../shared/utils/entities'

/**
 * Get item by slug command - returns a single item by its slug
 */
export function getItemBySlugCommand(slug: string): ItemDesc | null {
  const items = getAllItems()
  
  // Find item by comparing slugified names
  const item = items.find((item) => createSlug(item.name) === slug)
  
  return item || null
}

/**
 * Get all item slugs for static generation
 */
export function getAllItemSlugsCommand(): { tag: string; slug: string }[] {
  const items = getAllItems()
  
  return items.map((item) => ({
    tag: item.tag,
    slug: createSlug(item.name)
  }))
}