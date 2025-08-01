import type { WeaponWithStats } from '@/lib/spacetime-db-new/modules/weapons/flows'
import { TagPageView } from '@/views/tag-views/tag-page-view'

interface WeaponsIndividualTagPageViewProps {
  tagName: string
  weapons: WeaponWithStats[]
  backLink?: string
  backLinkText?: string
}

export function WeaponsIndividualTagPageView({
  tagName,
  weapons,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: WeaponsIndividualTagPageViewProps) {
  // Get the lowest available rarity for weapons, then filter by that rarity and volume > 0
  const lowestRarity = getLowestRarity(weapons)
  const filteredWeapons = weapons.filter(
    (weapon) =>
      weapon.item.rarity.tag === lowestRarity && weapon.item.volume > 0
  )

  // Deduplicate by name+tier (keep only one weapon per name+tier combination)
  const deduplicatedWeapons = filteredWeapons.reduce(
    (acc, weapon) => {
      const key = `${weapon.item.name}_T${weapon.item.tier}`
      if (!acc[key]) {
        acc[key] = weapon
      }
      return acc
    },
    {} as Record<string, WeaponWithStats>
  )

  const weaponsList = Object.values(deduplicatedWeapons)

  // Create single group for all weapons
  const itemGroups = [
    {
      name: tagName,
      items: weaponsList.map((weapon) => ({
        ...weapon.item,
        // Add weapon stats as properties
        minDamage: weapon.weaponData.minDamage,
        maxDamage: weapon.weaponData.maxDamage,
        cooldown: weapon.weaponData.cooldown.toFixed(2),
        staminaMultiplier: weapon.weaponData.staminaUseMultiplier.toFixed(2),
        weaponType: weapon.weaponType.name
      })),
      columns: [
        { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
        { key: 'name', label: 'Name', sortable: true },
        {
          key: 'tier',
          label: 'Tier',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'minDamage',
          label: 'Min Damage',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'maxDamage',
          label: 'Max Damage',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'cooldown',
          label: 'Cooldown (s)',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'staminaMultiplier',
          label: 'Stamina Multiplier',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'weaponType',
          label: 'Type',
          sortable: true,
          className: 'text-center'
        }
      ]
    }
  ]

  // Weapons statistics
  const totalWeapons = weapons.length

  return (
    <TagPageView
      title={tagName}
      subtitle={`${totalWeapons} weapons in this category`}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
    />
  )
}
