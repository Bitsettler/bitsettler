import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getAllItemTags } from '../commands/get-all-item-tags'
import { getItemsByTags } from '../commands/get-items-by-tags'

export interface ItemTagMetadata {
  id: string
  name: string
  description: string
  icon?: string
  section: string
  href: string
  category: string
  count: number
}

/**
 * Get metadata for all item tags by combining game data with controlled metadata
 */
export function getItemTagsMetadata(): ItemTagMetadata[] {
  const allTags = getAllItemTags()

  return allTags.map((tag) => {
    // Get first item of this tag for dynamic data
    const itemsForTag = getItemsByTags([tag])
    const firstItem = itemsForTag[0]

    const slug = createSlug(tag)

    return {
      id: slug,
      name: tag, // Use the tag as the display name
      description: firstItem?.description || `Items of type ${tag}`,
      icon: firstItem?.iconAssetName, // Use actual icon asset name
      section: 'Items', // All items belong to Items section
      href: `/compendium/${slug}`,
      category: 'Items', // Same as section for now
      count: itemsForTag.length
    }
  })
}