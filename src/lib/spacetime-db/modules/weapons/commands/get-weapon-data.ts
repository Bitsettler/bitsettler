import weaponDescData from '@/data/sdk-tables/weapon_desc.json'
import type { WeaponDesc } from '@/data/bindings/weapon_desc_type'

/**
 * Get weapon stats data from SDK tables
 */
export function getWeaponData(): WeaponDesc[] {
  return weaponDescData as WeaponDesc[]
}