import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { WeaponDesc } from '@/data/bindings/weapon_desc_type'
import itemDescData from '@/data/sdk-tables/item_desc.json'
import weaponDescData from '@/data/sdk-tables/weapon_desc.json'

// SDK data is already in camelCase format, no transformation needed
const items = itemDescData as ItemDesc[]
const weapons = weaponDescData as WeaponDesc[]

/**
 * Get all weapon items from SDK data (items that have corresponding weapon descriptions)
 */
export function getAllWeapons(): ItemDesc[] {
  return weapons
    .map((weaponDesc) => {
      return items.find((item) => item.id === weaponDesc.itemId)
    })
    .filter(
      (item): item is ItemDesc => item !== undefined && item.compendiumEntry
    )
}
