import type { BuildingTypeDesc } from '@/data/bindings/building_type_desc_type'
import { getBuildingData } from './get-building-data'

/**
 * Get building type description by ID
 */
export function getBuildingTypeById(id: number): BuildingTypeDesc | undefined {
  const { buildingTypeDesc } = getBuildingData()
  return buildingTypeDesc.find((buildingType) => buildingType.id === id)
}
