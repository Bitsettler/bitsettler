import { getWeaponsGroupedByType, getWeaponStatistics } from '@/lib/spacetime-db/weapons'
import { WeaponsView } from '@/views/weapon-index-page-view/weapons-view'

export default function WeaponsPage() {
  const weaponsByType = getWeaponsGroupedByType()
  const statistics = getWeaponStatistics()

  return (
    <WeaponsView
      title="Weapons"
      subtitle={`${statistics.total} weapons across ${statistics.types} weapon types`}
      weaponsByType={weaponsByType}
    />
  )
}
