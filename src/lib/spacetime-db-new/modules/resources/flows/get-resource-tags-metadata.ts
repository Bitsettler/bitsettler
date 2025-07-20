import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getAllResourceTags } from '../commands/get-all-resource-tags'
import { getResourcesByTags } from '../commands/get-resources-by-tags'

export interface ResourceTagMetadata {
  id: string
  name: string
  description: string
  icon: string | undefined
  section: string
  href: string
  category: string
  count: number
}

/**
 * Controlled metadata organized by section with arrays of tags
 */
const SECTIONS_TO_TAGS: Record<string, string[]> = {
  'Trees & Lumber': ['Tree', 'Wood Logs', 'Sapling', 'Stick', 'Stump'],
  'Forage & Plants': ['Berry', 'Fruit', 'Flower', 'Mushroom', 'Fiber Plant', 'Wild Grain', 'Wild Vegetable', 'Insects'],
  'Minerals & Stone': ['Rock', 'Rock Boulder', 'Rock Outcrop', 'Clay', 'Sand', 'Salt', 'Ore Vein', 'Metal Outcrop'],
  'Aquatic Resources': ['Ocean Fish School', 'Lake Fish School', 'Chummed Ocean Fish School', 'Baitfish', 'Mollusks'],
  'Special Resources': ['Monster Den', 'Wonder Resource', 'Energy Font', 'Research', 'Note', 'Bones'],
  'Interactive Objects': ['Door', 'Obstacle', 'Depleted Resource']
}

/**
 * Get the section/category for a given tag
 */
function getTagSection(tag: string): string {
  for (const [section, tags] of Object.entries(SECTIONS_TO_TAGS)) {
    if (tags.includes(tag)) {
      return section
    }
  }
  return 'Other Resources'
}

/**
 * Get metadata for all resource tags by combining game data with controlled metadata
 */
export function getResourceTagsMetadata(): ResourceTagMetadata[] {
  const allTags = getAllResourceTags()

  return allTags.map((tag) => {
    // Get first resource of this tag for dynamic data
    const resourcesForTag = getResourcesByTags([tag])
    const firstResource = resourcesForTag[0]

    const section = getTagSection(tag)
    const slug = createSlug(tag)

    return {
      id: slug,
      name: tag, // Use the tag as the display name
      description: firstResource?.description || `Resources of type ${tag}`,
      icon: firstResource?.iconAssetName || undefined, // Using emoji fallback for now
      section,
      href: `/compendium/resources/${slug}`,
      category: section, // Same as section for now
      count: resourcesForTag.length
    }
  })
}
