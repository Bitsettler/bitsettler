import {
  getWeaponsWithStats,
  type WeaponWithStats
} from './get-weapons-with-stats'

export interface WeaponGroup {
  weaponType: string
  weapons: WeaponWithStats[]
  isHuntingType: boolean
}

/**
 * Get weapons grouped by weapon type for table display
 */
export function getWeaponsGroupedByType(): WeaponGroup[] {
  const weaponsWithStats = getWeaponsWithStats()

  // Group weapons by weapon type
  const groupedWeapons: Record<string, WeaponWithStats[]> = {}

  weaponsWithStats.forEach((weapon) => {
    const typeName = weapon.weaponType.name
    if (!groupedWeapons[typeName]) {
      groupedWeapons[typeName] = []
    }
    groupedWeapons[typeName].push(weapon)
  })

  // Convert to array format with metadata
  const weaponGroups: WeaponGroup[] = Object.entries(groupedWeapons).map(
    ([weaponType, weapons]) => {
      // Sort weapons within each group by tier, then by max damage
      const sortedWeapons = weapons.sort((a, b) => {
        if (a.item.tier !== b.item.tier) {
          return a.item.tier - b.item.tier
        }
        return b.weaponData.maxDamage - a.weaponData.maxDamage
      })

      return {
        weaponType,
        weapons: sortedWeapons,
        isHuntingType: weapons[0]?.weaponType.hunting || false
      }
    }
  )

  // Sort groups by name
  return weaponGroups.sort((a, b) => a.weaponType.localeCompare(b.weaponType))
}
