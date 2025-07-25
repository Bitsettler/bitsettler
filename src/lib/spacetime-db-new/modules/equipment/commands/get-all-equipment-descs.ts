import type { EquipmentDesc } from '@/data/bindings/equipment_desc_type'
import equipmentDescData from '@/data/sdk-tables/equipment_desc.json'

// SDK data is already in camelCase format, no transformation needed
const equipmentDescs = equipmentDescData as EquipmentDesc[]

/**
 * Get all equipment descriptions from SDK data
 */
export function getAllEquipmentDescs(): EquipmentDesc[] {
  return equipmentDescs
}