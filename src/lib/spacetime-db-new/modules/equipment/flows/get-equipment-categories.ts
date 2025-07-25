import { getAllEquipmentItems } from '../commands'

export interface EquipmentCategory {
  id: string
  name: string
  description: string
  category: string
  href: string
  count: number
  firstEquipment?: {
    name: string
    iconAssetName: string
  }
}

/**
 * Equipment category metadata - maps item tags to UI categories
 */
const equipmentCategoryMetadata: Record<string, Omit<EquipmentCategory, 'count' | 'firstEquipment'>> = {
  'Metal Armor': {
    id: 'metal-armor',
    name: 'Metal Armor',
    description: 'Heavy armor and protective gear made from metal',
    category: 'Armor & Clothing',
    href: '/compendium/metal-armor'
  },
  'Leather Clothing': {
    id: 'leather-clothing',
    name: 'Leather Clothing',
    description: 'Flexible clothing and armor made from leather',
    category: 'Armor & Clothing',
    href: '/compendium/leather-clothing'
  },
  'Cloth Clothing': {
    id: 'cloth-clothing',
    name: 'Cloth Clothing',
    description: 'Lightweight clothing and basic protective gear',
    category: 'Armor & Clothing',
    href: '/compendium/cloth-clothing'
  },
  'Cosmetic Clothes': {
    id: 'cosmetic-clothes',
    name: 'Cosmetic Clothes',
    description: 'Decorative clothing and fashion items',
    category: 'Accessories',
    href: '/compendium/cosmetic-clothes'
  },
  Jewelry: {
    id: 'jewelry',
    name: 'Jewelry',
    description: 'Rings, necklaces, and other decorative accessories',
    category: 'Accessories',
    href: '/compendium/jewelry'
  },
  'Automata Heart': {
    id: 'automata-heart',
    name: 'Automata Heart',
    description: 'Specialized equipment for automata and mechanical beings',
    category: 'Special Equipment',
    href: '/compendium/automata-heart'
  }
}

/**
 * Get equipment categories with item counts from actual game data
 */
export function getEquipmentCategories(): EquipmentCategory[] {
  const equipmentItems = getAllEquipmentItems()

  // Group equipment by their tag
  const equipmentByTag: Record<string, { count: number; firstEquipment?: (typeof equipmentItems)[0] }> = {}

  equipmentItems.forEach((equipment) => {
    if (!equipmentByTag[equipment.tag]) {
      equipmentByTag[equipment.tag] = { count: 0, firstEquipment: equipment }
    }
    equipmentByTag[equipment.tag].count++
  })

  // Create categories with actual counts and first equipment icon
  const categories: EquipmentCategory[] = []

  Object.entries(equipmentCategoryMetadata).forEach(([tag, metadata]) => {
    const equipmentData = equipmentByTag[tag]
    if (equipmentData && equipmentData.count > 0) {
      // Only include categories that have equipment
      categories.push({
        ...metadata,
        count: equipmentData.count,
        firstEquipment: equipmentData.firstEquipment
          ? {
              name: equipmentData.firstEquipment.name,
              iconAssetName: equipmentData.firstEquipment.iconAssetName
            }
          : undefined
      })
    }
  })

  // Sort by category type, then by name
  return categories.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.name.localeCompare(b.name)
  })
}
