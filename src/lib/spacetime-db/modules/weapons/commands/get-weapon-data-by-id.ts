import { getWeaponData } from './get-weapon-data'
import type { WeaponDesc } from '@/data/bindings/weapon_desc_type'

/**
 * Get weapon stats by item ID
 */
export function getWeaponDataById(itemId: number): WeaponDesc | undefined {
  const weaponData = getWeaponData()
  return weaponData.find((weapon) => weapon.itemId === itemId)
}