import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getAllCargoTags } from '../commands/get-all-cargo-tags'
import { getCargoByTags } from '../commands/get-cargo-by-tags'

export interface CargoTagMetadata {
  id: string
  name: string
  description: string
  icon: string
  section: string
  href: string
  category: string
  count: number
}

/**
 * Controlled metadata organized by section with arrays of tags
 * Based on the original cargo collections structure
 */
const SECTIONS_TO_TAGS: Record<string, string[]> = {
  'Creatures & Wildlife': ['Animal', 'Monster', 'Ocean Fish'],
  'Raw Materials': ['Timber', 'Chunk', 'Ore Chunk', 'Geode', 'Roots'],
  'Processed Materials': ['Brick Slab', 'Frame', 'Sheeting', 'Tarp', 'Trunk'],
  'Vehicles & Transport': ['Vehicle', 'Boat'],
  'Trade & Commerce': ['Package', 'Brico Goods', 'Traveler Goods', 'Supplies'],
  'Currency & Value': ['Hex Coin Sack', 'Hexite Capsule'],
  'Special Items': ['Energy']
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
  return 'Other Cargo'
}

/**
 * Get metadata for all cargo tags by combining game data with controlled metadata
 */
export function getCargoTagsMetadata(): CargoTagMetadata[] {
  const allTags = getAllCargoTags()
  
  return allTags.map(tag => {
    // Get first cargo of this tag for dynamic data
    const cargoForTag = getCargoByTags([tag])
    const firstCargo = cargoForTag[0]
    
    const section = getTagSection(tag)
    const slug = createSlug(tag)
    
    return {
      id: slug,
      name: tag, // Use the tag as the display name
      description: firstCargo?.description || `Cargo items of type ${tag}`,
      icon: firstCargo?.iconAssetName, // Use actual icon asset name
      section,
      href: `/compendium/cargo/${slug}`,
      category: section, // Same as section for now
      count: cargoForTag.length
    }
  })
}