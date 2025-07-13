import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { WeaponDesc } from '@/data/bindings/weapon_desc_type'
import type { WeaponTypeDesc } from '@/data/bindings/weapon_type_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import weaponDescData from '@/data/global/weapon_desc.json'
import weaponTypeDescData from '@/data/global/weapon_type_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Combined weapon data with item information
export interface WeaponWithItem extends WeaponDesc {
  item: ItemDesc
  weaponTypeName: string
}

/**
 * Get weapon-related data from static JSON files
 */
function getWeaponData() {
  return {
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    weaponDesc: camelCaseDeep<WeaponDesc[]>(weaponDescData),
    weaponTypeDesc: camelCaseDeep<WeaponTypeDesc[]>(weaponTypeDescData)
  }
}

/**
 * Alias for getWeaponData to maintain compatibility
 */
async function fetchWeaponData() {
  return getWeaponData()
}

/**
 * Get all weapon items from live data
 */
export async function getWeaponItems(): Promise<ItemDesc[]> {
  const { itemDesc } = await fetchWeaponData()
  return itemDesc.filter((item) => item.compendiumEntry && item.tag === 'Weapon')
}

/**
 * Get all weapon stats from live data
 */
export async function getWeaponStats(): Promise<WeaponDesc[]> {
  const { weaponDesc } = await fetchWeaponData()
  return weaponDesc
}

/**
 * Get all weapon types from live data
 */
export async function getWeaponTypes(): Promise<WeaponTypeDesc[]> {
  const { weaponTypeDesc } = await fetchWeaponData()
  return weaponTypeDesc
}

/**
 * Get weapon type name by ID
 */
export async function getWeaponTypeName(weaponTypeId: number): Promise<string> {
  const weaponTypes = await getWeaponTypes()
  const weaponType = weaponTypes.find((type) => type.id === weaponTypeId)
  return weaponType?.name || 'Unknown'
}

/**
 * Combine weapon items with their stats and weapon type information
 */
export async function getWeaponsWithStats(): Promise<WeaponWithItem[]> {
  const { itemDesc, weaponDesc, weaponTypeDesc } = await fetchWeaponData()

  const weaponItems = itemDesc.filter((item) => item.compendiumEntry && item.tag === 'Weapon')
  const weaponStats = weaponDesc

  const results: WeaponWithItem[] = []

  for (const item of weaponItems) {
    const stats = weaponStats.find((stat) => stat.itemId === item.id)
    if (stats) {
      const weaponType = weaponTypeDesc.find((type) => type.id === stats.weaponType)
      const weaponTypeName = weaponType?.name || 'Unknown'

      results.push({
        ...stats,
        item,
        weaponTypeName
      })
    }
  }

  return results
}

/**
 * Get weapons grouped by weapon type, sorted by tier
 */
export async function getWeaponsGroupedByType(): Promise<Record<string, WeaponWithItem[]>> {
  const weapons = await getWeaponsWithStats()

  const grouped: Record<string, WeaponWithItem[]> = {}

  for (const weapon of weapons) {
    if (!grouped[weapon.weaponTypeName]) {
      grouped[weapon.weaponTypeName] = []
    }
    grouped[weapon.weaponTypeName].push(weapon)
  }

  // Sort each group by tier
  for (const weaponType in grouped) {
    grouped[weaponType].sort((a, b) => a.tier - b.tier)
  }

  return grouped
}

/**
 * Get weapon statistics overview
 */
export async function getWeaponStatistics() {
  const weapons = await getWeaponsWithStats()
  const weaponTypes = await getWeaponTypes()

  const totalWeapons = weapons.length
  const weaponsByType = await getWeaponsGroupedByType()
  const typeCount = Object.keys(weaponsByType).length

  const tierDistribution: Record<number, number> = {}
  weapons.forEach((weapon) => {
    tierDistribution[weapon.tier] = (tierDistribution[weapon.tier] || 0) + 1
  })

  return {
    total: totalWeapons,
    types: typeCount,
    availableTypes: weaponTypes.length,
    tierDistribution,
    weaponsByType: Object.entries(weaponsByType).map(([type, weapons]) => ({
      type,
      count: weapons.length
    }))
  }
}
