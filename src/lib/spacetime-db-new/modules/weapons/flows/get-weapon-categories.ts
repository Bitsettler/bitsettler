import { getAllWeapons } from '../commands'

export interface WeaponCategory {
  id: string
  name: string
  description: string
  category: 'Combat' | 'Hunting'
  href: string
  count: number
  firstWeapon?: {
    name: string
    iconAssetName: string
  }
}

/**
 * Weapon category metadata - maps item tags to UI categories
 */
const weaponCategoryMetadata: Record<string, Omit<WeaponCategory, 'count' | 'firstWeapon'>> = {
  'Weapon': {
    id: 'weapon',
    name: 'All Weapons',
    description: 'Combat and hunting weapons for various purposes',
    category: 'Combat',
    href: '/compendium/weapon'
  }
}

/**
 * Get weapon categories with item counts from actual game data
 */
export function getWeaponCategories(): WeaponCategory[] {
  const weapons = getAllWeapons()

  // Group weapons by their tag
  const weaponsByTag: Record<string, { count: number; firstWeapon?: typeof weapons[0] }> = {}
  
  weapons.forEach(weapon => {
    if (!weaponsByTag[weapon.tag]) {
      weaponsByTag[weapon.tag] = { count: 0, firstWeapon: weapon }
    }
    weaponsByTag[weapon.tag].count++
  })

  // Create categories with actual counts and first weapon icon
  const categories: WeaponCategory[] = []
  
  Object.entries(weaponCategoryMetadata).forEach(([tag, metadata]) => {
    const weaponData = weaponsByTag[tag]
    if (weaponData && weaponData.count > 0) { // Only include categories that have weapons
      categories.push({
        ...metadata,
        count: weaponData.count,
        firstWeapon: weaponData.firstWeapon ? {
          name: weaponData.firstWeapon.name,
          iconAssetName: weaponData.firstWeapon.iconAssetName
        } : undefined
      })
    }
  })

  // Sort by category type, then by name
  return categories.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.name.localeCompare(b.name)
  })
}