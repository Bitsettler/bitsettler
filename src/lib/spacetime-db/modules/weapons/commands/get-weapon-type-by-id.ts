import { getWeaponTypeData } from './get-weapon-type-data'
import type { WeaponTypeDesc } from '@/data/bindings/weapon_type_desc_type'

/**
 * Get weapon type by ID
 */
export function getWeaponTypeById(weaponTypeId: number): WeaponTypeDesc | undefined {
  const weaponTypes = getWeaponTypeData()
  return weaponTypes.find((type) => type.id === weaponTypeId)
}