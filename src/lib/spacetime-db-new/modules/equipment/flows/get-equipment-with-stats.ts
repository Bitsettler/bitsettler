import type { EquipmentDesc } from '@/data/bindings/equipment_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getAllEquipmentItems, getEquipmentDescByItemId } from '../commands'

export interface EquipmentWithStats {
  item: ItemDesc
  equipmentData: EquipmentDesc
}

/**
 * Get equipment with stats by joining item and equipment description data
 * Note: Stats and slots are already in usable format from SDK, no decoding needed
 */
export function getEquipmentWithStats(): EquipmentWithStats[] {
  const equipmentItems = getAllEquipmentItems()

  const results: EquipmentWithStats[] = []

  for (const item of equipmentItems) {
    const equipmentData = getEquipmentDescByItemId(item.id)
    if (!equipmentData) {
      console.warn(
        `Equipment item ${item.name} (ID: ${item.id}) has no corresponding equipment description`
      )
      continue
    }

    results.push({
      item,
      equipmentData
    })
  }

  // Sort by tag, then by tier, then by name
  return results.sort((a, b) => {
    // First sort by item tag (equipment type)
    if (a.item.tag !== b.item.tag) {
      return a.item.tag.localeCompare(b.item.tag)
    }
    // Then sort by tier
    if (a.item.tier !== b.item.tier) {
      return a.item.tier - b.item.tier
    }
    // Finally sort by name
    return a.item.name.localeCompare(b.item.name)
  })
}
