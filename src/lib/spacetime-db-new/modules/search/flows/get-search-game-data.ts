import { CargoDesc, ItemDesc, ResourceDesc } from '@/data/bindings'
import {
  transformToSearchData,
  type SearchData,
  type SearchItem
} from '../../../shared/dtos/search-dtos'
import { createSlug } from '../../../shared/utils/entities'
import { getAllCargo } from '../../cargo/commands/get-all-cargo'
import { getAllItems } from '../../items/commands/get-all-items'
import { getAllResources } from '../../resources/commands/get-all-resources'

/**
 * Transform items to search format
 */
function transformItemsToSearch(items: ItemDesc[]): SearchItem[] {
  return items
    .filter((item) => item.compendiumEntry)
    .map((item) => {
      const tagSlug = item.tag ? createSlug(item.tag) : 'items'
      const itemSlug = createSlug(item.name)

      return {
        id: `item-${item.id}`,
        name: item.name,
        slug: itemSlug,
        category: 'Items',
        type: 'item' as const,
        href: `/compendium/${tagSlug}/${itemSlug}`,
        tier: item.tier,
        tag: item.tag,
        description: item.description,
        icon_asset_name: item.iconAssetName
      }
    })
}

/**
 * Transform cargo to search format
 */
function transformCargoToSearch(cargo: CargoDesc[]): SearchItem[] {
  return cargo.map((item) => {
    const tagSlug = item.tag ? createSlug(item.tag) : 'general'
    const itemSlug = createSlug(item.name)

    return {
      id: `cargo-${item.id}`,
      name: item.name,
      slug: itemSlug,
      category: 'Cargo',
      type: 'cargo' as const,
      href: `/compendium/cargo/${tagSlug}/${itemSlug}`,
      tier: item.tier,
      tag: item.tag,
      description: item.description,
      icon_asset_name: item.iconAssetName
    }
  })
}

/**
 * Transform resources to search format
 */
function transformResourcesToSearch(resources: ResourceDesc[]): SearchItem[] {
  return resources
    .filter((resource) => resource.compendiumEntry)
    .map((resource) => {
      const tagSlug = resource.tag ? createSlug(resource.tag) : 'general'
      const itemSlug = createSlug(resource.name)

      return {
        id: `resource-${resource.id}`,
        name: resource.name,
        slug: itemSlug,
        category: 'Resources',
        type: 'resource' as const,
        href: `/compendium/resources/${tagSlug}/${itemSlug}`,
        tier: resource.tier,
        tag: resource.tag,
        description: resource.description,
        icon_asset_name: resource.iconAssetName
      }
    })
}

/**
 * Get processed search game data for the search functionality
 * This is a simplified version using the new spacetime-db-new modules
 */
export async function getSearchGameData(): Promise<SearchData> {
  const items = getAllItems()
  const cargo = getAllCargo()
  const resources = getAllResources()

  const searchItems = transformItemsToSearch(items)
  const searchCargo = transformCargoToSearch(cargo)
  const searchResources = transformResourcesToSearch(resources)
  const searchCollections: SearchItem[] = [] // TODO: Implement collections

  return transformToSearchData(
    searchItems,
    searchCargo,
    searchResources,
    searchCollections
  )
}
