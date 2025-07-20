import type { BuildingDesc } from '@/data/bindings/building_desc_type'
import type { BuildingFunctionTypeMappingDesc } from '@/data/bindings/building_function_type_mapping_desc_type'
import buildingFunctionMappingData from '@/data/sdk-tables/building_function_type_mapping_desc.json'
import { getAllBuildings } from './get-all-buildings'

// SDK data is already in camelCase format, no transformation needed
const buildingFunctionMappings = buildingFunctionMappingData as BuildingFunctionTypeMappingDesc[]

/**
 * Get all building descriptions that belong to a specific building type
 * Only includes buildings that should be shown in compendium
 */
export function getBuildingDescsByTypeId(typeId: number): BuildingDesc[] {
  const mapping = buildingFunctionMappings.find(m => m.typeId === typeId)
  if (!mapping) return []
  
  const compendiumBuildings = getAllBuildings()
  return compendiumBuildings.filter(desc => mapping.descIds.includes(desc.id))
}