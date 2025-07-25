import { getAllWeaponTypes } from './get-all-weapon-types'

/**
 * Get weapon type by ID
 */
export function getWeaponTypeById(id: number) {
  const weaponTypes = getAllWeaponTypes()
  return weaponTypes.find((type) => type.id === id)
}