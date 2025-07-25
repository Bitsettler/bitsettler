import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { WeaponDesc } from '@/data/bindings/weapon_desc_type'
import type { WeaponTypeDesc } from '@/data/bindings/weapon_type_desc_type'
import { getAllWeapons, getWeaponDescByItemId, getWeaponTypeById } from '../commands'

export interface WeaponWithStats {
  item: ItemDesc
  weaponData: WeaponDesc
  weaponType: WeaponTypeDesc
}

/**
 * Get weapons with enriched data by joining item, weapon description, and weapon type information
 */
export function getWeaponsWithStats(): WeaponWithStats[] {
  const weapons = getAllWeapons()

  const results: WeaponWithStats[] = []

  for (const item of weapons) {
    const weaponData = getWeaponDescByItemId(item.id)
    if (!weaponData) continue

    const weaponType = getWeaponTypeById(weaponData.weaponType)
    if (!weaponType) continue

    results.push({
      item,
      weaponData,
      weaponType
    })
  }

  // Sort by weapon type, then by tier, then by max damage
  return results.sort((a, b) => {
    // First sort by weapon type name
    if (a.weaponType.name !== b.weaponType.name) {
      return a.weaponType.name.localeCompare(b.weaponType.name)
    }
    // Then sort by tier
    if (a.item.tier !== b.item.tier) {
      return a.item.tier - b.item.tier
    }
    // Finally sort by max damage (higher damage first)
    return b.weaponData.maxDamage - a.weaponData.maxDamage
  })
}