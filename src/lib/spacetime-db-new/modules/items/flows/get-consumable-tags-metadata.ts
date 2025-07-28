import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getAllConsumableTags } from '../commands/get-all-consumable-tags'
import { getConsumablesByTags } from '../commands/get-consumables-by-tags'

export interface ConsumableTagMetadata {
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
 * Based on the original consumable collections structure
 */
const SECTIONS_TO_TAGS: Record<string, string[]> = {
  'Food & Nutrition': [
    'Basic Food',
    'Meal',
    'Raw Meal',
    'Berry',
    'Citric Berry',
    'Mushroom',
    'Sugar',
    'Tea',
    'Vegetable',
    'Wonder Fruit'
  ],
  'Potions & Medicine': [
    'Healing Potion',
    'Stamina Potion',
    'Crafting Speed Elixir',
    'Bandage'
  ],
  'Fishing Supplies': ['Bait', 'Chum'],
  'Crafting & Recipes': ['Recipe']
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
  return 'Other Consumables'
}

/**
 * Get metadata for all consumable tags by combining game data with controlled metadata
 */
export function getConsumableTagsMetadata(): ConsumableTagMetadata[] {
  const allTags = getAllConsumableTags()

  return allTags.map((tag) => {
    // Get first consumable of this tag for dynamic data
    const consumablesForTag = getConsumablesByTags([tag])
    const firstConsumable = consumablesForTag[0]

    const section = getTagSection(tag)
    const slug = createSlug(tag)

    return {
      id: slug,
      name: tag, // Use the tag as the display name
      description:
        firstConsumable?.description || `Consumable items of type ${tag}`,
      icon: firstConsumable?.iconAssetName, // Use actual icon asset name
      section,
      href: `/compendium/${slug}`,
      category: section, // Same as section for now
      count: consumablesForTag.length
    }
  })
}
