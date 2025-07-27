import { getAllConsumableTags } from './get-all-consumable-tags'
import { getAllItems } from './get-all-items'

/**
 * Get all consumable items from SDK data
 */
export function getAllConsumables() {
  const consumableTags = getAllConsumableTags()
  const items = getAllItems()

  return items.filter(
    (item) =>
      item.compendiumEntry && item.tag && consumableTags.includes(item.tag)
  )
}
