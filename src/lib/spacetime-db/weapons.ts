import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { WeaponDesc } from '@/data/bindings/weapon_desc_type'
import type { WeaponTypeDesc } from '@/data/bindings/weapon_type_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import weaponDescData from '@/data/global/weapon_desc.json'
import weaponTypeDescData from '@/data/global/weapon_type_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Raw weapon data interface from JSON
interface RawWeaponData {
  item_id: number
  tier: number
  weapon_type: number
  min_damage: number
  max_damage: number
  cooldown: number
  stamina_use_multiplier: number
}

// Combined weapon data with item information
export interface WeaponWithItem extends WeaponDesc {
  item: ItemDesc
  weaponTypeName: string
}

/**
 * Get all weapon items from item_desc.json
 */
export function getWeaponItems(): ItemDesc[] {
  const itemData = camelCaseDeep<ItemDesc[]>(itemDescData)
  return itemData.filter((item) => item.compendiumEntry && item.tag === 'Weapon')
}

/**
 * Get all weapon stats from weapon_desc.json
 */
export function getWeaponStats(): WeaponDesc[] {
  return camelCaseDeep<WeaponDesc[]>(weaponDescData as RawWeaponData[])
}

/**
 * Get all weapon types from weapon_type_desc.json
 */
export function getWeaponTypes(): WeaponTypeDesc[] {
  return camelCaseDeep<WeaponTypeDesc[]>(weaponTypeDescData)
}

/**
 * Get weapon type name by ID
 */
export function getWeaponTypeName(weaponTypeId: number): string {
  const weaponTypes = getWeaponTypes()
  const weaponType = weaponTypes.find((type) => type.id === weaponTypeId)
  return weaponType?.name || 'Unknown'
}

/**
 * Combine weapon items with their stats and weapon type information
 */
export function getWeaponsWithStats(): WeaponWithItem[] {
  const weaponItems = getWeaponItems()
  const weaponStats = getWeaponStats()

  const results: WeaponWithItem[] = []

  for (const item of weaponItems) {
    const stats = weaponStats.find((stat) => stat.itemId === item.id)
    if (stats) {
      const weaponTypeName = getWeaponTypeName(stats.weaponType)
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
export function getWeaponsGroupedByType(): Record<string, WeaponWithItem[]> {
  const weapons = getWeaponsWithStats()

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
export function getWeaponStatistics() {
  const weapons = getWeaponsWithStats()
  const weaponTypes = getWeaponTypes()

  const totalWeapons = weapons.length
  const weaponsByType = getWeaponsGroupedByType()
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
