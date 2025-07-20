import type { BuildingDesc } from '@/data/bindings/building_desc_type'
import buildingDescData from '@/data/global/building_desc.json'
import { camelCaseDeep } from '../../../shared/utils/case-utils'

/**
 * Get all buildings from static data
 */
export function getAllBuildings(): BuildingDesc[] {
  const buildingDesc = camelCaseDeep<BuildingDesc[]>(buildingDescData)
  return buildingDesc
}

/**
 * Get buildings filtered for compendium display
 */
export function getBuildings(): BuildingDesc[] {
  const buildings = getAllBuildings()
  return buildings.filter((building) => building.showInCompendium)
}
