import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { cleanIconAssetName, getServerIconPath } from '../../../shared/assets'
import { getWeaponTypeData } from '../commands/get-weapon-type-data'
import { getWeaponsWithStats, type WeaponWithStats } from './get-weapons-with-stats'

export interface WeaponTypeMetadata {
  id: number
  name: string
  slug: string
  isHuntingType: boolean
  count: number
  firstWeapon?: {
    name: string
    icon_asset_name: string
  }
}

export interface WeaponsGroupedByType {
  metadata: WeaponTypeMetadata[]
  groups: Record<string, WeaponWithStats[]>
}

/**
 * Get weapons grouped by weapon type with metadata
 */
export function getWeaponsGroupedByType(): WeaponsGroupedByType {
  const weaponsWithStats = getWeaponsWithStats()
  const weaponTypes = getWeaponTypeData()

  const groups: Record<string, WeaponWithStats[]> = {}
  const metadata: WeaponTypeMetadata[] = []

  // Create groups for each weapon type
  for (const weaponType of weaponTypes) {
    const typeWeapons = weaponsWithStats.filter((weapon) => weapon.weaponType.id === weaponType.id)

    if (typeWeapons.length > 0) {
      const slug = createSlug(weaponType.name)
      groups[slug] = typeWeapons.sort((a, b) => {
        // Sort by tier, then by name
        if (a.item.tier !== b.item.tier) {
          return a.item.tier - b.item.tier
        }
        return a.item.name.localeCompare(b.item.name)
      })

      const firstWeapon = typeWeapons[0]
      metadata.push({
        id: weaponType.id,
        name: weaponType.name,
        slug,
        isHuntingType: weaponType.hunting,
        count: typeWeapons.length,
        firstWeapon: {
          name: firstWeapon.item.name,
          icon_asset_name: getServerIconPath(cleanIconAssetName(firstWeapon.item.iconAssetName))
        }
      })
    }
  }

  // Sort metadata by name
  metadata.sort((a, b) => a.name.localeCompare(b.name))

  return { metadata, groups }
}
