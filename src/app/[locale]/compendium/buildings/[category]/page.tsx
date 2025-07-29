import {
  getAllBuildingTypes,
  getBuildingsByTypeName
} from '@/lib/spacetime-db-new/modules/buildings/commands'
import {
  createSlug,
  slugToTitleCase
} from '@/lib/spacetime-db-new/shared/utils/entities'
import { BuildingsIndividualCategoryPageView } from '@/views/buildings-views/buildings-individual-category-page-view'
import { notFound } from 'next/navigation'

interface BuildingsCategoryPageProps {
  params: Promise<{
    category: string
  }>
}

export default async function BuildingsCategoryPage({
  params
}: BuildingsCategoryPageProps) {
  const { category } = await params

  // Get buildings for this specific building type using SDK data (pass slug directly)
  const buildings = getBuildingsByTypeName(category)

  if (buildings.length === 0) {
    notFound()
  }

  // Find the actual building type name to display
  const buildingTypes = getAllBuildingTypes()
  const buildingType = buildingTypes.find(
    (type) => createSlug(type.name) === category
  )
  const displayName = buildingType?.name || slugToTitleCase(category)

  return (
    <BuildingsIndividualCategoryPageView
      categoryName={displayName}
      buildings={buildings}
      backLink="/compendium/buildings"
      backLinkText="← Back to Buildings"
    />
  )
}

// Disable static generation for internationalized routes to avoid next-intl config issues
// Pages will be generated on-demand instead
export const dynamic = 'force-dynamic'
