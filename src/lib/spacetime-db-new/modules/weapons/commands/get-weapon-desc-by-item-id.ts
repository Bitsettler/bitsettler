import { getAllWeaponDescs } from './get-all-weapon-descs'

/**
 * Get weapon description by item ID
 */
export function getWeaponDescByItemId(itemId: number) {
  const weaponDescs = getAllWeaponDescs()
  return weaponDescs.find((desc) => desc.itemId === itemId)
}