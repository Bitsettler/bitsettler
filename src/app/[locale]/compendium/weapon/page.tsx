import { getWeaponsGroupedByType, getWeaponStatistics } from '@/lib/spacetime-db/weapons'
import { WeaponsView } from '@/views/weapon-index-page-view/weapons-view'

export default function WeaponsPage() {
  const weaponsByType = getWeaponsGroupedByType()
  const statistics = getWeaponStatistics()

  // Statistics cards
  const statisticsCards = [
    {
      label: 'Total Weapons',
      value: statistics.total
    },
    {
      label: 'Weapon Types',
      value: statistics.types
    },
    {
      label: 'Tier Range',
      value: Object.keys(statistics.tierDistribution).length
    },
    {
      label: 'Min - Max Tier',
      value: `T${Math.min(...Object.keys(statistics.tierDistribution).map(Number))} - T${Math.max(...Object.keys(statistics.tierDistribution).map(Number))}`
    }
  ]

  return (
    <WeaponsView
      title="Weapons"
      subtitle={`${statistics.total} weapons across ${statistics.types} weapon types`}
      statisticsCards={statisticsCards}
      weaponsByType={weaponsByType}
    />
  )
}
