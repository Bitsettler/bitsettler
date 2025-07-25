import weaponTypeDescData from '@/data/sdk-tables/weapon_type_desc.json'
import type { WeaponTypeDesc } from '@/data/bindings/weapon_type_desc_type'

/**
 * Get weapon type data from SDK tables
 */
export function getWeaponTypeData(): WeaponTypeDesc[] {
  return weaponTypeDescData as WeaponTypeDesc[]
}