/**
 * TypeScript version of the Python game_data.py script
 *
 * This script connects to SpacetimeDB WebSocket endpoints, dumps table data,
 * fetches schema information, and saves everything to JSON files.
 *
 * Usage:
 *   npm run generate-game-data
 *
 * Or run directly with ts-node:
 *   npx ts-node scripts/generate-game-data.ts
 *
 * Environment variables:
 *   BITCRAFT_SPACETIME_HOST - SpacetimeDB host (required)
 *   BITCRAFT_SPACETIME_AUTH - Auth token (optional)
 *   DATA_DIR - Output directory (defaults to "src/data")
 *   BITCRAFT_REGION_MODULE - Region module name (optional, e.g. "bitcraft-6")
 */

import { config } from 'dotenv'
import { promises as fs } from 'fs'
import * as path from 'path'
import { WebSocket } from 'ws'

// Load environment variables from .env.local
config({ path: '.env.local' })

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

interface TransactionUpdate {
  status: {
    Failed?: string
  }
}

interface WebSocketMessage {
  InitialSubscription?: InitialSubscription
  TransactionUpdate?: TransactionUpdate
}

interface SubscribeMessage {
  Subscribe: {
    request_id: number
    query_strings: string[]
  }
}

interface RegionConnectionInfo {
  host: string
  module: string
}

interface SchemaTable {
  name: string
  table_access: string | string[]
}

interface Schema {
  tables: SchemaTable[]
}

type Query = string | [string, string, string]

function dumpTables(
  host: string,
  module: string,
  queries: Query | Query[],
  auth?: string
): Promise<Record<string, any[]>> {
  return new Promise((resolve, reject) => {
    const saveData: Record<string, any[]> = {}
    let newQueries: Query[] | null = null

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
        console.log('  Headers:', {
          Authorization: `Bearer ${auth.substring(0, 20)}...`
        })
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
            console.log(
              `Total tables processed: ${Object.keys(saveData).length}`
            )
            ws.close()
          } else if (
            msg.TransactionUpdate &&
            msg.TransactionUpdate.status.Failed
          ) {
            console.log(
              'Transaction failed:',
              msg.TransactionUpdate.status.Failed
            )
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
        reject(error)
      })

      ws.on('close', () => {
        if (newQueries) {
          dumpTables(host, module, newQueries, auth).then(resolve).catch(reject)
        } else {
          resolve(saveData)
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

async function getSchema(host: string, module: string): Promise<Schema | null> {
  try {
    const target = uri
      .replace('{scheme}', 'https')
      .replace('{host}', host)
      .replace('{module}', module)
      .replace('{endpoint}', 'schema')

    const url = new URL(target)
    url.searchParams.set('version', '9')

    const response = await fetch(url.toString())
    if (response.status === 200) {
      return await response.json()
    }
    return null
  } catch (error) {
    console.error('Error fetching schema:', error)
    return null
  }
}

async function getRegionInfo(
  globalHost: string,
  auth?: string
): Promise<RegionConnectionInfo | null> {
  // Check if region module is specified in environment
  const regionModule = process.env.BITCRAFT_REGION_MODULE

  if (regionModule) {
    console.log(`Using region module from environment: ${regionModule}`)
    return {
      host: globalHost, // Same host as global
      module: regionModule
    }
  }

  // If no region module specified, try to auto-detect from available modules
  // This is a fallback that probably won't work, but we'll try anyway
  try {
    console.log(
      'No region module specified, attempting to get region connection info...'
    )
    const res = await dumpTables(
      globalHost,
      'bitcraft-global',
      'region_connection_info',
      auth
    )
    console.log('Region connection info response:', Object.keys(res))

    const regionInfo = res['region_connection_info']

    if (!regionInfo || regionInfo.length === 0) {
      console.log('No region connection info found in response')
      console.log('Available tables:', Object.keys(res))
      return null
    }

    console.log('Found region connection info:', regionInfo)
    const obj = regionInfo[regionInfo.length - 1] // Get the last entry
    console.log('Using region info object:', obj)

    const urlObj = new URL('http://' + obj.host) // Parse the host

    return {
      host: urlObj.hostname,
      module: obj.module
    }
  } catch (error) {
    console.error('Error getting region info:', error)
    return null
  }
}

async function saveTables(
  dataDir: string,
  subdir: string,
  tables: Record<string, any[]>
): Promise<void> {
  const root = path.join(dataDir, subdir)
  await fs.mkdir(root, { recursive: true })

  console.log(`Saving ${Object.keys(tables).length} tables to ${root}`)

  function getSort(x: any): number {
    // Handle various id field patterns
    return (
      x.id ??
      x.item_id ??
      x.building_id ??
      x.cargo_id ??
      x.type_id ??
      (x.name ? 0 : -1)
    )
  }

  for (const [name, data] of Object.entries(tables)) {
    if (data.length === 0) {
      console.log(`Warning: Table ${name} has no data`)
      continue
    }

    const sortedData = [...data].sort((a, b) => {
      const aSort = getSort(a)
      const bSort = getSort(b)
      return aSort - bSort
    })

    const filePath = path.join(root, name + '.json')
    await fs.writeFile(filePath, JSON.stringify(sortedData, null, 2))
    console.log(`Saved table ${name} with ${sortedData.length} rows`)
  }
}

async function tableNamesToFile(
  schema: Schema,
  tableFile: string
): Promise<void> {
  const tables = schema.tables || []

  // Debug: log a few table_access values to understand the format
  console.log('Debugging table_access values:')
  tables.slice(0, 5).forEach((t) => {
    console.log(
      `Table: ${t.name}, table_access:`,
      t.table_access,
      `(type: ${typeof t.table_access})`
    )
  })

  const tableAccess = tables.reduce(
    (acc, t) => {
      // Check if 'Public' key exists in the table_access object
      // Format is like { Public: [] } or { Private: [] }
      const isPublic = Boolean(
        t.table_access &&
          typeof t.table_access === 'object' &&
          !Array.isArray(t.table_access) &&
          'Public' in t.table_access
      )

      acc[t.name] = isPublic
      return acc
    },
    {} as Record<string, boolean>
  )

  const publicTables = Object.keys(tableAccess).filter(
    (name) => tableAccess[name]
  )
  const privateTables = Object.keys(tableAccess).filter(
    (name) => !tableAccess[name]
  )

  console.log(
    `Generated ${publicTables.length} public tables and ${privateTables.length} private tables`
  )

  const result = {
    public: publicTables,
    private: privateTables
  }

  await fs.writeFile(tableFile, JSON.stringify(result, null, 2))
}

async function main(): Promise<void> {
  const dataDir =
    process.env.DATA_DIR || path.join(process.cwd(), 'src', 'data')
  await fs.mkdir(dataDir, { recursive: true })

  const globalHost = process.env.BITCRAFT_SPACETIME_HOST
  if (!globalHost) {
    throw new Error('BITCRAFT_SPACETIME_HOST environment variable is not set')
  }

  const auth = process.env.BITCRAFT_SPACETIME_AUTH || undefined

  console.log('Fetching global schema...')
  const schemaGlb = await getSchema(globalHost, 'bitcraft-global')
  if (schemaGlb) {
    await fs.writeFile(
      path.join(dataDir, 'global_schema.json'),
      JSON.stringify(schemaGlb, null, 2)
    )
    const tableFile = path.join(dataDir, 'global_tables.json')
    await tableNamesToFile(schemaGlb, tableFile)
  }

  console.log('Getting region info...')
  const regionInfo = await getRegionInfo(globalHost, auth)

  if (regionInfo) {
    console.log(`Found region: ${regionInfo.host}/${regionInfo.module}`)
    const schema = await getSchema(regionInfo.host, regionInfo.module)
    if (schema) {
      await fs.writeFile(
        path.join(dataDir, 'schema.json'),
        JSON.stringify(schema, null, 2)
      )
      const tableFile = path.join(dataDir, 'region_tables.json')
      await tableNamesToFile(schema, tableFile)
    }
  } else {
    console.log(
      'Could not get region info. To specify your region, add to your .env.local:'
    )
    console.log('  BITCRAFT_REGION_MODULE=bitcraft-6')
    console.log('  (replace "bitcraft-6" with your actual region module name)')
    console.log('Skipping region schema')
  }

  const curatedTables = [
    'achievement_desc',
    'alert_desc',
    'biome_desc',
    'buff_desc',
    'buff_type_desc',
    'building_claim_desc',
    'building_desc',
    'building_function_type_mapping_desc',
    'building_portal_desc',
    'building_repairs_desc',
    'building_type_desc',
    'cargo_desc',
    'character_stat_desc',
    'claim_tech_desc',
    'claim_tile_cost',
    'climb_requirement_desc',
    'clothing_desc',
    'collectible_desc',
    'combat_action_desc',
    'construction_recipe_desc',
    'crafting_recipe_desc',
    'deconstruction_recipe_desc',
    'deployable_desc',
    'distant_visible_entity_desc',
    'elevator_desc',
    'emote_desc',
    'empire_color_desc',
    'empire_icon_desc',
    'empire_notification_desc',
    'empire_rank_desc',
    'empire_supplies_desc',
    'empire_territory_desc',
    'enemy_ai_params_desc',
    'enemy_desc',
    'environment_debuff_desc',
    'equipment_desc',
    'extraction_recipe_desc',
    'food_desc',
    'gate_desc',
    'hexite_exchange_entry_desc',
    'interior_environment_desc',
    'interior_instance_desc',
    'interior_network_desc',
    'interior_portal_connections_desc',
    'interior_shape_desc',
    'interior_spawn_desc',
    'item_conversion_recipe_desc',
    'item_desc',
    'item_list_desc',
    'knowledge_scroll_desc',
    'knowledge_stat_modifier_desc',
    'loot_chest_desc',
    'loot_table_desc',
    'npc_desc',
    'parameters_desc',
    'pathfinding_desc',
    'paving_tile_desc',
    'pillar_shaping_desc',
    'player_action_desc',
    'player_housing_desc',
    'resource_desc',
    'resource_placement_recipe_desc',
    'secondary_knowledge_desc',
    'skill_desc',
    'targeting_matrix_desc',
    'teleport_item_desc',
    'terraform_recipe_desc',
    'tool_desc',
    'tool_type_desc',
    'traveler_task_desc',
    'traveler_trade_order_desc',
    'wall_desc',
    'weapon_desc',
    'weapon_type_desc'
  ]

  console.log(
    `Using curated list of ${curatedTables.length} tables (same as working Python script)`
  )

  if (curatedTables.length > 0) {
    console.log(`Dumping ${curatedTables.length} global tables...`)
    const globalRes = await dumpTables(
      globalHost,
      'bitcraft-global',
      curatedTables,
      auth
    )
    console.log(
      `Received ${Object.keys(globalRes).length} global tables from WebSocket`
    )
    await saveTables(dataDir, 'global', globalRes)
  } else {
    console.log('No global tables to dump')
  }

  if (curatedTables.length > 0 && regionInfo) {
    console.log(
      `Dumping ${curatedTables.length} region tables from ${regionInfo.host}/${regionInfo.module}...`
    )
    const regionRes = await dumpTables(
      regionInfo.host,
      regionInfo.module,
      curatedTables,
      auth
    )
    console.log(
      `Received ${Object.keys(regionRes).length} region tables from WebSocket`
    )
    await saveTables(dataDir, 'region', regionRes)
  } else if (curatedTables.length > 0) {
    console.log('No region info available, cannot dump region tables')
  } else {
    console.log('No region tables to dump')
  }

  // Set GitHub Actions output if running in CI
  const githubOutput = process.env.GITHUB_OUTPUT
  if (githubOutput) {
    await fs.appendFile(githubOutput, 'updated_data=true\n')
  }

  console.log('✅ Successfully generated game data')
}

// Run the main function
main().catch(console.error)
