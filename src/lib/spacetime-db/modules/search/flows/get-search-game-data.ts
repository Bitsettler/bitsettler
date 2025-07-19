import { getAllCargo } from '@/lib/spacetime-db/modules/cargo/commands/get-all-cargo'
import { transformCargoToSearch } from '@/lib/spacetime-db/modules/cargo/cargo'
import { transformCollectionsToSearch } from '@/lib/spacetime-db/modules/collections/search'
import { getAllItems } from '@/lib/spacetime-db/modules/items/commands/get-all-items'
import { transformItemsToSearch } from '@/lib/spacetime-db/modules/items/commands'
import { getAllResources } from '@/lib/spacetime-db/modules/resources/commands/get-all-resources'
import { transformResourcesToSearch } from '@/lib/spacetime-db/modules/resources/commands'
import { shouldFilterItem } from '@/lib/spacetime-db/shared/calculator-utils'
import { transformToSearchData, type SearchData } from '@/lib/spacetime-db/shared/dtos/search-dtos'

/**
 * Get processed search game data for the search functionality
 */
export async function getSearchGameData(): Promise<SearchData> {
  const itemDesc = getAllItems()
  const cargoDesc = getAllCargo()
  const resourceDesc = getAllResources()

  const filteredItems = itemDesc.filter((item) => item.compendiumEntry)
  const filteredResources = resourceDesc.filter((resource) => resource.compendiumEntry)
  const filteredCargo = cargoDesc.filter((cargo) => !shouldFilterItem(cargo))

  const searchItems = transformItemsToSearch(filteredItems)
  const searchCargo = transformCargoToSearch(filteredCargo)
  const searchResources = transformResourcesToSearch(filteredResources)
  const searchCollections = transformCollectionsToSearch()

  return transformToSearchData(searchItems, searchCargo, searchResources, searchCollections)
}