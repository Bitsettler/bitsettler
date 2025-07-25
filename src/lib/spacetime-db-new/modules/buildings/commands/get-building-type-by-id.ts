import type { BuildingTypeDesc } from '@/data/bindings/building_type_desc_type'
import buildingTypeDescData from '@/data/sdk-tables/building_type_desc.json'

// SDK data is already in camelCase format, no transformation needed
const buildingTypes = buildingTypeDescData as BuildingTypeDesc[]

/**
 * Get building type by ID
 */
export function getBuildingTypeById(id: number): BuildingTypeDesc | undefined {
  return buildingTypes.find((type) => type.id === id)
}

/**
 * Get all building types
 */
export function getAllBuildingTypes(): BuildingTypeDesc[] {
  return buildingTypes
}
