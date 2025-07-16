// Main data access functions
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ItemListDesc } from '@/data/bindings/item_list_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import cargoDescData from '@/data/global/cargo_desc.json'
import craftingRecipeDescData from '@/data/global/crafting_recipe_desc.json'
import extractionRecipeDescData from '@/data/global/extraction_recipe_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import itemListDescData from '@/data/global/item_list_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import type { CalculatorGameData } from './calculator-dtos'
import { mapCargoToCalculatorItem, transformCargoToCalculator } from './cargo/calculator'
import { transformCargoToSearch } from './cargo/search'
import { transformCollectionsToSearch } from './collections/search'
import { mapItemToCalculatorItem, transformItemsToCalculator } from './items/calculator'
import { transformItemsToSearch } from './items/search'
import { transformCraftingRecipesToCalculator, transformExtractionRecipesToCalculator } from './recipes/calculator'
import { mapResourceToCalculatorItem, transformResourcesToCalculator } from './resources/calculator'
import { transformResourcesToSearch } from './resources/search'
import { transformToSearchData, type SearchData } from './search-dtos'
import { createUnifiedLookup, shouldFilterItem } from './shared/calculator-utils'

/**
 * Get game data from static JSON files
 */
function getGameData() {
  return {
    craftingRecipeDesc: camelCaseDeep<CraftingRecipeDesc[]>(craftingRecipeDescData),
    extractionRecipeDesc: camelCaseDeep<ExtractionRecipeDesc[]>(extractionRecipeDescData),
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    cargoDesc: camelCaseDeep<CargoDesc[]>(cargoDescData),
    resourceDesc: camelCaseDeep<ResourceDesc[]>(resourceDescData),
    itemListDesc: camelCaseDeep<ItemListDesc[]>(itemListDescData)
  }
}

/**
 * Get all items (including cargo and resources) from static data
 */
export async function getAllGameItems(): Promise<{
  items: ItemDesc[]
  cargo: CargoDesc[]
  resources: ResourceDesc[]
}> {
  const { itemDesc, cargoDesc, resourceDesc } = getGameData()
  return {
    items: itemDesc.filter((item) => item.compendiumEntry),
    cargo: cargoDesc,
    resources: resourceDesc.filter((resource) => resource.compendiumEntry)
  }
}

/**
 * Get search-ready game data from spacetime-db
 */
export async function getSearchGameData(): Promise<SearchData> {
  const { itemDesc, cargoDesc, resourceDesc } = getGameData()

  // Filter items for compendium entries
  const filteredItems = itemDesc.filter((item) => item.compendiumEntry)
  const filteredResources = resourceDesc.filter((resource) => resource.compendiumEntry)
  const filteredCargo = cargoDesc.filter((cargo) => !shouldFilterItem(cargo))

  // Transform each module using module-specific search functions
  const searchItems = transformItemsToSearch(filteredItems)
  const searchCargo = transformCargoToSearch(filteredCargo)
  const searchResources = transformResourcesToSearch(filteredResources)
  const searchCollections = transformCollectionsToSearch()

  return transformToSearchData(searchItems, searchCargo, searchResources, searchCollections)
}

/**
 * Get calculator-ready game data from spacetime-db
 */
export function getCalculatorGameData(): CalculatorGameData {
  const { itemDesc, cargoDesc, resourceDesc, craftingRecipeDesc, extractionRecipeDesc, itemListDesc } = getGameData()

  // Filter items for compendium entries
  const filteredItems = itemDesc.filter((item) => item.compendiumEntry)
  const filteredResources = resourceDesc.filter((resource) => resource.compendiumEntry)
  const filteredCargo = cargoDesc.filter((cargo) => !shouldFilterItem(cargo))

  // Transform each module using module-specific functions
  const calculatorItems = transformItemsToCalculator(filteredItems)
  const calculatorCargo = transformCargoToCalculator(filteredCargo)
  const calculatorResources = transformResourcesToCalculator(filteredResources)

  // Combine all items for unified lookup
  const allCalculatorItems = [...calculatorItems, ...calculatorCargo, ...calculatorResources]

  // Create unified lookup for recipe processing
  const unifiedLookup = createUnifiedLookup(
    filteredItems,
    filteredCargo,
    filteredResources,
    mapItemToCalculatorItem,
    mapCargoToCalculatorItem,
    mapResourceToCalculatorItem
  )

  // Transform recipes using module-specific functions
  const calculatorCraftingRecipes = transformCraftingRecipesToCalculator(craftingRecipeDesc, itemListDesc, itemDesc)
  const calculatorExtractionRecipes = transformExtractionRecipesToCalculator(extractionRecipeDesc, unifiedLookup)
  const allCalculatorRecipes = [...calculatorCraftingRecipes, ...calculatorExtractionRecipes]

  return {
    items: allCalculatorItems,
    recipes: allCalculatorRecipes
  }
}

// Re-export utilities for consolidated access
export { assetExists, cleanIconAssetName, getFallbackIconPath, getServerIconPath } from './assets'
export type { CalculatorGameData, CalculatorItem, CalculatorRecipe } from './calculator-dtos'
export { createSlug, getTierColor } from './entities'
export type { SearchData, SearchItem } from './search-dtos'

// Re-export module-specific calculator functions
export { mapCargoToCalculatorItem, transformCargoToCalculator } from './cargo/calculator'
export {
  findTagCollection,
  getEquipmentTags,
  getWeaponTags,
  tagCollections,
  type TagCategory,
  type TagCollection
} from './item-tag-collections'
export { mapItemToCalculatorItem, transformItemsToCalculator } from './items/calculator'
export {
  getAllProfessions,
  getProfessionById,
  getProfessionBySlug,
  getProfessionsByCategory,
  getProfessionsByType,
  getProfessionStats,
  type Profession
} from './professions'
export { convertRarityArrayToString, convertRarityToString, getRarityColor, getRarityDisplayName } from './rarity'
export { getCraftingRecipes, getExtractionRecipes } from './recipes'
export {
  mapCraftingRecipeToCalculatorRecipe,
  mapExtractionRecipeToCalculatorRecipe,
  transformCraftingRecipesToCalculator,
  transformExtractionRecipesToCalculator
} from './recipes/calculator'
export { mapResourceToCalculatorItem, transformResourcesToCalculator } from './resources/calculator'
export { cleanIconAssetPath, createUnifiedLookup, getItemPrefix, shouldFilterItem } from './shared/calculator-utils'

// Re-export search functions
export { mapCargoToSearchItem, transformCargoToSearch } from './cargo/search'
export { transformCollectionsToSearch } from './collections/search'
export { mapItemToSearchItem, transformItemsToSearch } from './items/search'
export { mapResourceToSearchItem, transformResourcesToSearch } from './resources/search'

// Re-export main transformation function for backward compatibility
export { transformToCalculatorData } from './calculator-dtos'
export { getAllCargo, getAllItems, getItemsByTags } from './utils'
export {
  getWeaponItems,
  getWeaponsGroupedByCategory,
  getWeaponsGroupedByType,
  getWeaponStatistics,
  getWeaponStats,
  getWeaponsWithStats,
  getWeaponTypeById,
  getWeaponTypeName,
  getWeaponTypes,
  isHuntingWeaponType,
  type WeaponWithItem
} from './weapons'

// const uri = '{scheme}://{host}/v1/database/{module}/{endpoint}'
// const proto = 'v1.json.spacetimedb'

// interface TableData {
//   table_name: string
//   updates: Array<{
//     inserts: string[]
//   }>
// }

// interface InitialSubscription {
//   database_update: {
//     tables: TableData[]
//   }
// }

// interface WebSocketMessage {
//   InitialSubscription?: InitialSubscription
//   TransactionUpdate?: {
//     status: {
//       Failed?: string
//     }
//   }
// }

// interface SubscribeMessage {
//   Subscribe: {
//     request_id: number
//     query_strings: string[]
//   }
// }

// type Query = string | [string, string, string]

// export function dumpTables(
//   host: string,
//   module: string,
//   queries: Query | Query[],
//   auth?: string
// ): Promise<Record<string, unknown[]>> {
//   return new Promise((resolve, reject) => {
//     const saveData: Record<string, unknown[]> = {}
//     let newQueries: Query[] | null = null

//     // Add timeout for build environments
//     const timeout = setTimeout(() => {
//       reject(new Error('WebSocket connection timeout - this is expected during build time'))
//     }, 10000) // 10 second timeout

//     // Normalize queries to array
//     const queryArray: Query[] = Array.isArray(queries) ? queries : [queries]

//     try {
//       const wsUrl = uri
//         .replace('{scheme}', 'wss')
//         .replace('{host}', host)
//         .replace('{module}', module)
//         .replace('{endpoint}', 'subscribe')

//       console.log('Connecting to WebSocket:')
//       console.log('  URL:', wsUrl)
//       if (auth) {
//         console.log('  Headers:', { Authorization: `Bearer ${auth.substring(0, 20)}...` })
//       } else {
//         console.log('  Headers: none')
//       }
//       console.log('  Subprotocols:', [proto])

//       const headers: Record<string, string> = {}
//       if (auth) {
//         headers['Authorization'] = `Bearer ${auth}`
//       }

//       const ws = new WebSocket(wsUrl, [proto], {
//         headers
//       })

//       let hasReceivedInitialMessage = false

//       ws.on('open', () => {
//         console.log('WebSocket connected')
//         // Don't send subscription immediately - wait for initial message first
//       })

//       ws.on('message', (data) => {
//         try {
//           if (!hasReceivedInitialMessage) {
//             // Handle the initial message (like Python's ws.recv())
//             console.log('Received initial message, now sending subscription...')
//             hasReceivedInitialMessage = true

//             // Send subscription message after receiving initial message
//             const sub: SubscribeMessage = {
//               Subscribe: {
//                 request_id: 1,
//                 query_strings: queryArray.map((q: Query) => {
//                   if (typeof q === 'string') {
//                     return `SELECT * FROM ${q};`
//                   } else {
//                     return `SELECT * FROM ${q[0]} WHERE ${q[1]} = ${q[2]};`
//                   }
//                 })
//               }
//             }

//             ws.send(JSON.stringify(sub))
//             return
//           }

//           const msg: WebSocketMessage = JSON.parse(data.toString())
//           console.log('Received WebSocket message type:', Object.keys(msg))

//           if (msg.InitialSubscription) {
//             console.log('Processing InitialSubscription...')
//             const initial = msg.InitialSubscription.database_update.tables
//             console.log(`Found ${initial.length} tables in response`)

//             for (const table of initial) {
//               const name = table.table_name
//               const rows = table.updates[0].inserts
//               console.log(`Processing table ${name} with ${rows.length} rows`)
//               saveData[name] = rows.map((row) => JSON.parse(row))
//             }
//             console.log(`Total tables processed: ${Object.keys(saveData).length}`)
//             ws.close()
//           } else if (msg.TransactionUpdate && msg.TransactionUpdate.status.Failed) {
//             console.log('Transaction failed:', msg.TransactionUpdate.status.Failed)
//             const failure = msg.TransactionUpdate.status.Failed
//             const badTableMatch = failure.match(/`(\w*)` is not a valid table/)
//             if (badTableMatch) {
//               const badTable = badTableMatch[1]
//               console.log('Invalid table, skipping and retrying: ' + badTable)
//               newQueries = queryArray.filter((q: Query) => {
//                 if (typeof q === 'string') {
//                   return q !== badTable
//                 } else {
//                   return q[0] !== badTable
//                 }
//               })
//             }
//             ws.close()
//           } else {
//             console.log('Unknown message type:', msg)
//           }
//         } catch (error) {
//           console.error('Error parsing WebSocket message:', error)
//           console.log('Raw message:', data.toString())
//         }
//       })

//       ws.on('error', (error) => {
//         clearTimeout(timeout)
//         reject(error)
//       })

//       ws.on('close', () => {
//         clearTimeout(timeout)
//         if (newQueries) {
//           dumpTables(host, module, newQueries, auth).then(resolve).catch(reject)
//         } else {
//           resolve(saveData)
//         }
//       })
//     } catch (error) {
//       clearTimeout(timeout)
//       reject(error)
//     }
//   })
// }

// export async function fetchItemDesc(): Promise<ItemDesc[]> {
//   const host = process.env.BITCRAFT_SPACETIME_HOST
//   const auth = process.env.BITCRAFT_AUTH_TOKEN || process.env.BITCRAFT_SPACETIME_AUTH
//   const moduleAddress = 'bitcraft-global' // Use global module like generate-game-data.ts

//   if (!host) {
//     throw new Error('BITCRAFT_SPACETIME_HOST environment variable is not set')
//   }

//   console.log(`Fetching from module: ${moduleAddress}`)
//   const tables = await dumpTables(host, moduleAddress, ['item_desc'], auth)
//   console.log('Available tables:', Object.keys(tables))
//   return (tables['item_desc'] as ItemDesc[]) || []
// }
