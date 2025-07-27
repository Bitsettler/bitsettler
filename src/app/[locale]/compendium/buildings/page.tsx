import { getBuildingsTypeMetadata } from '@/lib/spacetime-db-new/modules/buildings/flows'
import { BuildingsView } from '@/views/buildings-views/buildings-index-page-view'

export default async function BuildingsPage() {
  const buildingCategories = getBuildingsTypeMetadata()
  const totalBuildings = buildingCategories.reduce(
    (sum, category) => sum + category.count,
    0
  )

  return (
    <BuildingsView
      title="Buildings & Structures"
      subtitle={`${totalBuildings} buildings across ${buildingCategories.length} categories`}
      buildingCategories={buildingCategories}
    />
  )
}
