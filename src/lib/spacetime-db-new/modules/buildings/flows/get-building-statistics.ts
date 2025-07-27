import { getAllItems } from '../../items/commands/get-all-items'
import { getAllBuildings } from '../commands/get-all-buildings'

/**
 * Get basic building statistics for HomePage
 */
export function getBuildingStatistics() {
  const buildings = getAllBuildings()
  const allItems = getAllItems()

  // Filter buildings that are marked for compendium entry
  const compendiumBuildings = buildings.filter(
    (building) => building.showInCompendium
  )

  // Get Writ items (construction permits and building documents)
  const writs = allItems.filter(
    (item) => item.compendiumEntry && item.tag === 'Writ'
  )

  return {
    totalBuildings: compendiumBuildings.length,
    totalWrits: writs.length
  }
}
