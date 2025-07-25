import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getAllItems } from '../../items/commands/get-all-items'

/**
 * Get all weapon items from SDK data
 */
export function getAllWeapons(): ItemDesc[] {
  const items = getAllItems()
  return items.filter((item) => item.tag === 'Weapon' && item.compendiumEntry)
}
