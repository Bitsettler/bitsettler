import type { WeaponTypeDesc } from '@/data/bindings/weapon_type_desc_type'
import weaponTypeDescData from '@/data/sdk-tables/weapon_type_desc.json'

// SDK data is already in camelCase format, no transformation needed
const weaponTypes = weaponTypeDescData as WeaponTypeDesc[]

/**
 * Get all weapon types from SDK data
 */
export function getAllWeaponTypes(): WeaponTypeDesc[] {
  return weaponTypes.filter((w) => !w.hunting)
}
