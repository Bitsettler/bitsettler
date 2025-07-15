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
  weaponTypeData?: WeaponTypeDesc
  damageRange: string
  isHuntingWeapon: boolean
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
 * Get weapon type by ID with full type data
 */
export async function getWeaponTypeById(weaponTypeId: number): Promise<WeaponTypeDesc | undefined> {
  const weaponTypes = await getWeaponTypes()
  return weaponTypes.find((type) => type.id === weaponTypeId)
}

/**
 * Check if a weapon type is for hunting
 */
export async function isHuntingWeaponType(weaponTypeId: number): Promise<boolean> {
  const weaponType = await getWeaponTypeById(weaponTypeId)
  return weaponType?.hunting ?? false
}

/**
 * Combine weapon items with their stats and weapon type information
 */
export async function getWeaponsWithStats(): Promise<WeaponWithItem[]> {
  const { itemDesc, weaponDesc, weaponTypeDesc } = await fetchWeaponData()

  const weaponItems = itemDesc.filter((item) => item.compendiumEntry && item.tag === 'Weapon')

  const results: WeaponWithItem[] = []

  for (const item of weaponItems) {
    const weaponData = weaponDesc.find((weapon) => weapon.itemId === item.id)
    if (weaponData) {
      // Find weapon type with proper typing and error handling
      const weaponTypeData = weaponTypeDesc.find((type) => type.id === weaponData.weaponType)
      const weaponTypeName = weaponTypeData?.name || 'Unknown'
      
      // Calculate damage range string
      const damageRange = weaponData.minDamage === weaponData.maxDamage 
        ? weaponData.minDamage.toString()
        : `${weaponData.minDamage}-${weaponData.maxDamage}`
      
      // Determine if it's a hunting weapon
      const isHuntingWeapon = weaponTypeData?.hunting ?? false

      results.push({
        ...weaponData,
        item,
        weaponTypeName,
        weaponTypeData,
        damageRange,
        isHuntingWeapon
      })
    }
  }

  return results
}

/**
 * Get weapons grouped by weapon type, sorted by tier then by name
 */
export async function getWeaponsGroupedByType(): Promise<Record<string, WeaponWithItem[]>> {
  const weapons = await getWeaponsWithStats()

  const grouped: Record<string, WeaponWithItem[]> = {}

  for (const weapon of weapons) {
    const typeName = weapon.weaponTypeName
    if (!grouped[typeName]) {
      grouped[typeName] = []
    }
    grouped[typeName].push(weapon)
  }

  // Sort each group by tier, then by item name for consistent ordering
  for (const weaponType in grouped) {
    grouped[weaponType].sort((a, b) => {
      // First sort by tier
      if (a.item.tier !== b.item.tier) {
        return a.item.tier - b.item.tier
      }
      // Then sort by name for weapons in the same tier
      return a.item.name.localeCompare(b.item.name)
    })
  }

  return grouped
}

/**
 * Get weapons grouped by hunting/combat category
 */
export async function getWeaponsGroupedByCategory(): Promise<Record<string, WeaponWithItem[]>> {
  const weapons = await getWeaponsWithStats()

  const grouped: Record<string, WeaponWithItem[]> = {
    'Hunting Weapons': [],
    'Combat Weapons': []
  }

  for (const weapon of weapons) {
    const category = weapon.isHuntingWeapon ? 'Hunting Weapons' : 'Combat Weapons'
    grouped[category].push(weapon)
  }

  // Sort each group by weapon type, then by tier, then by name
  for (const category in grouped) {
    grouped[category].sort((a, b) => {
      // First sort by weapon type name
      if (a.weaponTypeName !== b.weaponTypeName) {
        return a.weaponTypeName.localeCompare(b.weaponTypeName)
      }
      // Then sort by tier
      if (a.item.tier !== b.item.tier) {
        return a.item.tier - b.item.tier
      }
      // Finally sort by name
      return a.item.name.localeCompare(b.item.name)
    })
  }

  return grouped
}

/**
 * Get weapon statistics overview
 */
export async function getWeaponStatistics() {
  const weapons = await getWeaponsWithStats()
  const weaponTypes = await getWeaponTypes()
  const weaponsByType = await getWeaponsGroupedByType()
  const weaponsByCategory = await getWeaponsGroupedByCategory()

  const totalWeapons = weapons.length
  const typeCount = Object.keys(weaponsByType).length
  
  // Calculate tier distribution
  const tierDistribution: Record<number, number> = {}
  weapons.forEach((weapon) => {
    tierDistribution[weapon.item.tier] = (tierDistribution[weapon.item.tier] || 0) + 1
  })

  // Calculate hunting vs combat distribution
  const huntingWeapons = weapons.filter(w => w.isHuntingWeapon).length
  const combatWeapons = weapons.filter(w => !w.isHuntingWeapon).length

  // Calculate damage statistics (using inherited WeaponDesc properties)
  const damageStats = weapons.length > 0 ? {
    minDamage: Math.min(...weapons.map(w => (w as WeaponDesc).minDamage)),
    maxDamage: Math.max(...weapons.map(w => (w as WeaponDesc).maxDamage)),
    avgMinDamage: Math.round(weapons.reduce((sum, w) => sum + (w as WeaponDesc).minDamage, 0) / weapons.length),
    avgMaxDamage: Math.round(weapons.reduce((sum, w) => sum + (w as WeaponDesc).maxDamage, 0) / weapons.length)
  } : {
    minDamage: 0,
    maxDamage: 0,
    avgMinDamage: 0,
    avgMaxDamage: 0
  }

  return {
    total: totalWeapons,
    types: typeCount,
    availableTypes: weaponTypes.length,
    huntingWeapons,
    combatWeapons,
    tierDistribution,
    damageStats,
    weaponsByType: Object.entries(weaponsByType).map(([type, weaponList]) => ({
      type,
      count: weaponList.length,
      isHuntingType: weaponList[0]?.isHuntingWeapon ?? false
    })),
    weaponsByCategory: Object.entries(weaponsByCategory).map(([category, weaponList]) => ({
      category,
      count: weaponList.length
    }))
  }
}
