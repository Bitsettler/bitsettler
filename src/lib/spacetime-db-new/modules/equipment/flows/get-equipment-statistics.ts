import { getAllEquipmentItems } from '../commands'

export interface EquipmentStatistics {
  total: number
  categories: number
}

/**
 * Get comprehensive statistics about equipment
 */
export function getEquipmentStatistics(): EquipmentStatistics {
  const equipmentItems = getAllEquipmentItems()

  // Count unique equipment categories (tags)
  const uniqueCategories = new Set(equipmentItems.map((item) => item.tag))

  return {
    total: equipmentItems.length,
    categories: uniqueCategories.size
  }
}
