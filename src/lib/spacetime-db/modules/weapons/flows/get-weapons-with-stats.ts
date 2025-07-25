import { getAllWeapons } from '../commands/get-all-weapons'
import { getWeaponDataById } from '../commands/get-weapon-data-by-id'
import { getWeaponTypeById } from '../commands/get-weapon-type-by-id'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { WeaponDesc } from '@/data/bindings/weapon_desc_type'
import type { WeaponTypeDesc } from '@/data/bindings/weapon_type_desc_type'

export interface WeaponWithStats {
  item: ItemDesc
  weaponData: WeaponDesc
  weaponType: WeaponTypeDesc
  damageRange: string
  isHuntingWeapon: boolean
}

/**
 * Get weapons with their stats and type information
 */
export function getWeaponsWithStats(): WeaponWithStats[] {
  const weapons = getAllWeapons()
  const results: WeaponWithStats[] = []

  for (const weapon of weapons) {
    const weaponData = getWeaponDataById(weapon.id)
    if (!weaponData) continue

    const weaponType = getWeaponTypeById(weaponData.weaponType)
    if (!weaponType) continue

    const damageRange = weaponData.minDamage === weaponData.maxDamage
      ? weaponData.minDamage.toString()
      : `${weaponData.minDamage}-${weaponData.maxDamage}`

    results.push({
      item: weapon,
      weaponData,
      weaponType,
      damageRange,
      isHuntingWeapon: weaponType.hunting
    })
  }

  return results
}