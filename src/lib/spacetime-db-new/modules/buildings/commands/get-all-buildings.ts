import type { BuildingDesc } from '@/data/bindings/building_desc_type'
import buildingDescData from '@/data/sdk-tables/building_desc.json'

// SDK data is already in camelCase format, no transformation needed
const buildings = buildingDescData as BuildingDesc[]

/**
 * Get all buildings from SDK data that should be shown in compendium
 */
export function getAllBuildings(): BuildingDesc[] {
  return buildings.filter((building) => building.showInCompendium)
}
