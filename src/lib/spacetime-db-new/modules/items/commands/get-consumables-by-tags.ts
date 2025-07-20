import { getItemsByTags } from './get-items-by-tags'
import { getAllConsumableTags } from './get-all-consumable-tags'

/**
 * Get consumable items by tags
 */
export function getConsumablesByTags(tags: string[]) {
  // Filter to only return items that are actually consumable tags
  const consumableTags = getAllConsumableTags()
  const validConsumableTags = tags.filter(tag => consumableTags.includes(tag))
  
  return getItemsByTags(validConsumableTags)
}