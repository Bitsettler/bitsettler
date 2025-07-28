import type { BuildingDesc } from '@/data/bindings/building_desc_type'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getBuildingDescsByTypeId } from './get-building-descs-by-type-id'
import { getAllBuildingTypes } from './get-building-type-by-id'

/**
 * Get all buildings that belong to a building type by type name
 * Only includes buildings that should be shown in compendium
 */
export function getBuildingsByTypeName(slug: string): BuildingDesc[] {
  const buildingTypes = getAllBuildingTypes().map((type) => ({
    ...type,
    slug: createSlug(type.name)
  }))
  const buildingType = buildingTypes.find((type) => type.slug === slug)

  if (!buildingType) return []

  return getBuildingDescsByTypeId(buildingType.id)
}
