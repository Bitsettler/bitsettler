import { getWeaponsGroupedByType, getWeaponStatistics } from '@/lib/spacetime-db-new/modules/weapons/flows'
import { WeaponsView } from '@/views/weapon-views/weapons-index-page-view'

export default function WeaponsPage() {
  // Get weapons grouped by type for table display
  const weaponGroups = getWeaponsGroupedByType()
  
  // Get live weapon statistics
  const weaponStats = getWeaponStatistics()

  return (
    <WeaponsView
      title="Weapons"
      subtitle={`${weaponStats.total} weapons across ${weaponStats.types} weapon types`}
      weaponGroups={weaponGroups}
    />
  )
}
