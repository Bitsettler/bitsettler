import { getAllEquipmentDescs } from './get-all-equipment-descs'

/**
 * Get equipment description by item ID
 */
export function getEquipmentDescByItemId(itemId: number) {
  const equipmentDescs = getAllEquipmentDescs()
  return equipmentDescs.find((desc) => desc.itemId === itemId)
}
