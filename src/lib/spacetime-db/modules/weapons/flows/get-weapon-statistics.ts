import { getWeaponsWithStats } from './get-weapons-with-stats'

export interface WeaponStatistics {
  total: number
  types: number
}

/**
 * Get basic weapon statistics for display
 */
export function getWeaponStatistics(): WeaponStatistics {
  const weaponsWithStats = getWeaponsWithStats()
  
  // Count unique weapon types
  const uniqueTypes = new Set(weaponsWithStats.map(weapon => weapon.weaponType.name))
  
  return {
    total: weaponsWithStats.length,
    types: uniqueTypes.size
  }
}