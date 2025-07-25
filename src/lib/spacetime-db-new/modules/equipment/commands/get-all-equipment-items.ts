import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { EquipmentDesc } from '@/data/bindings/equipment_desc_type'
import itemDescData from '@/data/sdk-tables/item_desc.json'
import equipmentDescData from '@/data/sdk-tables/equipment_desc.json'

// SDK data is already in camelCase format, no transformation needed
const items = itemDescData as ItemDesc[]
const equipmentDescs = equipmentDescData as EquipmentDesc[]

// Equipment tags from the tag collections
const EQUIPMENT_TAGS = [
  'Metal Armor',
  'Leather Clothing', 
  'Cloth Clothing',
  'Cosmetic Clothes',
  'Jewelry',
  'Automata Heart'
]

/**
 * Get all equipment items from SDK data (items that have corresponding equipment descriptions)
 */
export function getAllEquipmentItems(): ItemDesc[] {
  return equipmentDescs
    .map((equipmentDesc) => {
      return items.find((item) => item.id === equipmentDesc.itemId)
    })
    .filter((item): item is ItemDesc => 
      item !== undefined && 
      item.compendiumEntry && 
      EQUIPMENT_TAGS.includes(item.tag)
    )
}