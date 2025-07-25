import { createSlug } from '../../../shared/utils/entities'
import { getAllItems } from './get-all-items'

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
