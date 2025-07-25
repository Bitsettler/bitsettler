import type { WeaponDesc } from '@/data/bindings/weapon_desc_type'
import weaponDescData from '@/data/sdk-tables/weapon_desc.json'

// SDK data is already in camelCase format, no transformation needed
const weaponDescs = weaponDescData as WeaponDesc[]

/**
 * Get all weapon descriptions from SDK data
 */
export function getAllWeaponDescs(): WeaponDesc[] {
  return weaponDescs
}