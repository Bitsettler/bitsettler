import { ItemDesc } from '@/data/bindings'
import { WebSocket } from 'ws'

// Re-export utilities for consolidated access
export { convertRarityToString, getRarityColor, getRarityDisplayName, convertRarityArrayToString } from './rarity'
export { getServerIconPath, assetExists, getFallbackIconPath, cleanIconAssetName } from './assets'
export { getTierColor, createSlug } from './entities'
export { getItemsByTags, getAllItems, getAllCargo } from './utils'
export { 
  getAllProfessions, 
  getProfessionById, 
  getProfessionBySlug, 
  getProfessionStats, 
  getProfessionsByCategory, 
  getProfessionsByType,
  type Profession 
} from './professions'
export { tagCollections, findTagCollection, getEquipmentTags, getWeaponTags, type TagCollection, type TagCategory } from './item-tag-collections'
export { 
  getWeaponItems, 
  getWeaponStats, 
  getWeaponTypes, 
  getWeaponTypeName, 
  getWeaponTypeById, 
  isHuntingWeaponType, 
  getWeaponsWithStats, 
  getWeaponsGroupedByType, 
  getWeaponsGroupedByCategory, 
  getWeaponStatistics,
  type WeaponWithItem 
} from './weapons'

const uri = '{scheme}://{host}/v1/database/{module}/{endpoint}'
const proto = 'v1.json.spacetimedb'

interface TableData {
  table_name: string
  updates: Array<{
    inserts: string[]
  }>
}

interface InitialSubscription {
  database_update: {
    tables: TableData[]
  }
}

interface WebSocketMessage {
  InitialSubscription?: InitialSubscription
  TransactionUpdate?: {
    status: {
      Failed?: string
    }
  }
}

interface SubscribeMessage {
  Subscribe: {
    request_id: number
    query_strings: string[]
  }
}

type Query = string | [string, string, string]

export function dumpTables(
  host: string,
  module: string,
  queries: Query | Query[],
  auth?: string
): Promise<Record<string, unknown[]>> {
  return new Promise((resolve, reject) => {
    const saveData: Record<string, unknown[]> = {}
    let newQueries: Query[] | null = null

    // Add timeout for build environments
    const timeout = setTimeout(() => {
      reject(new Error('WebSocket connection timeout - this is expected during build time'))
    }, 10000) // 10 second timeout

    // Normalize queries to array
    const queryArray: Query[] = Array.isArray(queries) ? queries : [queries]

    try {
      const wsUrl = uri
        .replace('{scheme}', 'wss')
        .replace('{host}', host)
        .replace('{module}', module)
        .replace('{endpoint}', 'subscribe')

      console.log('Connecting to WebSocket:')
      console.log('  URL:', wsUrl)
      if (auth) {
        console.log('  Headers:', { Authorization: `Bearer ${auth.substring(0, 20)}...` })
      } else {
        console.log('  Headers: none')
      }
      console.log('  Subprotocols:', [proto])

      const headers: Record<string, string> = {}
      if (auth) {
        headers['Authorization'] = `Bearer ${auth}`
      }

      const ws = new WebSocket(wsUrl, [proto], {
        headers
      })

      let hasReceivedInitialMessage = false

      ws.on('open', () => {
        console.log('WebSocket connected')
        // Don't send subscription immediately - wait for initial message first
      })

      ws.on('message', (data) => {
        try {
          if (!hasReceivedInitialMessage) {
            // Handle the initial message (like Python's ws.recv())
            console.log('Received initial message, now sending subscription...')
            hasReceivedInitialMessage = true

            // Send subscription message after receiving initial message
            const sub: SubscribeMessage = {
              Subscribe: {
                request_id: 1,
                query_strings: queryArray.map((q: Query) => {
                  if (typeof q === 'string') {
                    return `SELECT * FROM ${q};`
                  } else {
                    return `SELECT * FROM ${q[0]} WHERE ${q[1]} = ${q[2]};`
                  }
                })
              }
            }

            ws.send(JSON.stringify(sub))
            return
          }

          const msg: WebSocketMessage = JSON.parse(data.toString())
          console.log('Received WebSocket message type:', Object.keys(msg))

          if (msg.InitialSubscription) {
            console.log('Processing InitialSubscription...')
            const initial = msg.InitialSubscription.database_update.tables
            console.log(`Found ${initial.length} tables in response`)

            for (const table of initial) {
              const name = table.table_name
              const rows = table.updates[0].inserts
              console.log(`Processing table ${name} with ${rows.length} rows`)
              saveData[name] = rows.map((row) => JSON.parse(row))
            }
            console.log(`Total tables processed: ${Object.keys(saveData).length}`)
            ws.close()
          } else if (msg.TransactionUpdate && msg.TransactionUpdate.status.Failed) {
            console.log('Transaction failed:', msg.TransactionUpdate.status.Failed)
            const failure = msg.TransactionUpdate.status.Failed
            const badTableMatch = failure.match(/`(\w*)` is not a valid table/)
            if (badTableMatch) {
              const badTable = badTableMatch[1]
              console.log('Invalid table, skipping and retrying: ' + badTable)
              newQueries = queryArray.filter((q: Query) => {
                if (typeof q === 'string') {
                  return q !== badTable
                } else {
                  return q[0] !== badTable
                }
              })
            }
            ws.close()
          } else {
            console.log('Unknown message type:', msg)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          console.log('Raw message:', data.toString())
        }
      })

      ws.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })

      ws.on('close', () => {
        clearTimeout(timeout)
        if (newQueries) {
          dumpTables(host, module, newQueries, auth).then(resolve).catch(reject)
        } else {
          resolve(saveData)
        }
      })
    } catch (error) {
      clearTimeout(timeout)
      reject(error)
    }
  })
}

export async function fetchItemDesc(): Promise<ItemDesc[]> {
  const host = process.env.BITCRAFT_SPACETIME_HOST
  const auth = process.env.BITCRAFT_AUTH_TOKEN || process.env.BITCRAFT_SPACETIME_AUTH
  const moduleAddress = 'bitcraft-global' // Use global module like generate-game-data.ts

  if (!host) {
    throw new Error('BITCRAFT_SPACETIME_HOST environment variable is not set')
  }

  console.log(`Fetching from module: ${moduleAddress}`)
  const tables = await dumpTables(host, moduleAddress, ['item_desc'], auth)
  console.log('Available tables:', Object.keys(tables))
  return (tables['item_desc'] as ItemDesc[]) || []
}
