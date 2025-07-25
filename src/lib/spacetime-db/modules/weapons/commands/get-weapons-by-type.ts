import { getAllWeapons } from './get-all-weapons'
import { getWeaponDataById } from './get-weapon-data-by-id'
import type { ItemDesc } from '@/data/bindings/item_desc_type'

/**
 * Get weapons filtered by weapon type ID
 */
export function getWeaponsByType(weaponTypeId: number): ItemDesc[] {
  const weapons = getAllWeapons()
  
  return weapons.filter((weapon) => {
    const weaponData = getWeaponDataById(weapon.id)
    return weaponData?.weaponType === weaponTypeId
  })
}