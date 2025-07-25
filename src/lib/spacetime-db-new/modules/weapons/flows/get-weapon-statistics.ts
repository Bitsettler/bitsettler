import { getAllWeaponTypes } from '../commands'
import { getAllWeapons } from '../commands/get-all-weapons'

interface WeaponStatistics {
  total: number
  types: number
}

/**
 * Get comprehensive statistics about weapons
 */
export function getWeaponStatistics(): WeaponStatistics {
  const weapons = getAllWeapons()
  const types = getAllWeaponTypes().filter((type) => !type.hunting)

  return {
    total: weapons.length,
    types: types.length
  }
}
