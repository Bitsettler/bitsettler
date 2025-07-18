import { getWeaponsGroupedByType, getWeaponStatistics } from '@/lib/spacetime-db/modules/collections/weapons'
import { WeaponsView } from '@/views/weapon-views/weapons-view'

export default async function WeaponsPage() {
  const weaponsByType = await getWeaponsGroupedByType()
  const statistics = await getWeaponStatistics()

  return (
    <WeaponsView
      title="Weapons"
      subtitle={`${statistics.total} weapons across ${statistics.types} weapon types`}
      weaponsByType={weaponsByType}
    />
  )
}
