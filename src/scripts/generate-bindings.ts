/**
 * TypeScript version of the Python bindings script
 *
 * This script connects to a SpacetimeDB WebSocket endpoint, dumps table data,
 * and generates bindings for TypeScript using the spacetime CLI.
 *
 * Usage:
 *   npm run generate-bindings
 *
 * Or run directly with ts-node:
 *   npx ts-node scripts/generate-bindings.ts
 *
 * Environment variables (optional):
 *   BITCRAFT_SPACETIME_HOST - defaults to "bitcraft-early-access.spacetimedb.com"
 *   BITCRAFT_SPACETIME_AUTH - defaults to undefined (no auth)
 *   DATA_DIR - defaults to "src/data/bindings"
 */

import { exec } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { WebSocket } from 'ws'

const execAsync = promisify(exec)

const uri = '{scheme}://{host}/v1/database/{module}/{endpoint}'
const proto = 'v1.json.spacetimedb'

interface Program {
  hash: string
  bytes: string
}

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

function dumpTables(
  host: string,
  module: string,
  queries: string | string[],
  auth?: string
): Promise<Record<string, unknown[]>> {
  return new Promise((resolve, reject) => {
    const saveData: Record<string, unknown[]> = {}
    let newQueries: string[] | null = null

    if (typeof queries === 'string') {
      queries = [queries]
    }

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
          Authorization: auth.substring(0, 50) + '...'
        })
      } else {
        console.log('  Headers: none')
      }
      console.log('  Subprotocols:', [proto])

      const headers: Record<string, string> = {}
      if (auth) {
        headers['Authorization'] = auth
      }

      const ws = new WebSocket(wsUrl, [proto], {
        headers
      })

      ws.on('open', () => {
        console.log('WebSocket connected')

        // Send subscription message only after connection is established
        const sub: SubscribeMessage = {
          Subscribe: {
            request_id: 1,
            query_strings: (queries as string[]).map((q) => {
              if (typeof q === 'string') {
                return `SELECT * FROM ${q};`
              }
              return `SELECT * FROM ${q[0]} WHERE ${q[1]} = ${q[2]};`
            })
          }
        }

        ws.send(JSON.stringify(sub))
      })

      ws.on('message', (data) => {
        const msg: WebSocketMessage = JSON.parse(data.toString())

        if (msg.InitialSubscription) {
          const initial = msg.InitialSubscription.database_update.tables
          for (const table of initial) {
            const name = table.table_name
            const rows = table.updates[0].inserts
            saveData[name] = rows.map((row) => JSON.parse(row))
          }
          ws.close()
        } else if (
          msg.TransactionUpdate &&
          msg.TransactionUpdate.status.Failed
        ) {
          const failure = msg.TransactionUpdate.status.Failed
          const badTableMatch = failure.match(/`(\w*)` is not a valid table/)
          if (badTableMatch) {
            const badTable = badTableMatch[1]
            console.log('Invalid table, skipping and retrying: ' + badTable)
            newQueries = (queries as string[]).filter((q) => {
              if (typeof q === 'string') {
                return q !== badTable
              }
              return q[0] !== badTable
            })
          }
          ws.close()
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

async function generateBindings(
  dataDir: string,
  programs: Program[]
): Promise<[boolean, string | null]> {
  const manifestPath = path.join(dataDir, 'manifest.txt')

  // Read existing programs
  let existingPrograms: string[] = []
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8')
    existingPrograms = manifestContent.split('\n').filter((line) => line.trim())
  } catch {
    // File doesn't exist, start with empty array
  }

  let updated = false
  let progHash: string | null = null

  for (const prog of programs) {
    const hsh = prog.hash
    if (parseInt(hsh, 16) === 0 || existingPrograms.includes(hsh)) {
      continue
    }

    console.log('Generating bindings for ' + hsh)

    // Create wasm directory
    const wasmDir = 'bins'
    await fs.mkdir(wasmDir, { recursive: true })

    // Write wasm file
    const wasmPath = path.join(wasmDir, hsh + '.wasm')
    const wasmBuffer = Buffer.from(prog.bytes, 'hex')
    await fs.writeFile(wasmPath, wasmBuffer)

    // Wait 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Generate bindings for TypeScript
    const languages = ['ts']
    const processes = languages.map(async (lang) => {
      const outputDir = dataDir
      const command = `spacetime generate -y -l ${lang} -b ${wasmPath} -o ${outputDir}`

      try {
        const { stdout, stderr } = await execAsync(command)
        if (stderr) {
          console.error(`stderr for ${lang}:`, stderr)
        }
        return { success: true, lang, stdout }
      } catch (error) {
        console.error(`Error generating ${lang} bindings:`, error)
        throw error
      }
    })

    try {
      await Promise.all(processes)
    } catch (error) {
      throw new Error(`Failed to generate bindings: ${error}`)
    }

    // Update manifest
    existingPrograms.push(hsh)
    await fs.writeFile(manifestPath, existingPrograms.join('\n'))

    updated = true
    progHash = hsh

    // Only process one program at a time
    break
  }

  return [updated, progHash]
}

async function main(): Promise<void> {
  const dataDir =
    process.env.DATA_DIR || path.join(process.cwd(), 'src', 'data', 'bindings')
  await fs.mkdir(dataDir, { recursive: true })

  const globalHost =
    process.env.BITCRAFT_SPACETIME_HOST ||
    'bitcraft-early-access.spacetimedb.com'
  const auth = process.env.BITCRAFT_SPACETIME_AUTH || undefined

  const tables = await dumpTables(
    globalHost,
    'spacetime-control',
    'program',
    auth
  )
  const programs = tables['program'] as Program[]

  const [updated, progHash] = await generateBindings(dataDir, programs)

  if (updated) {
    console.log(`✅ Successfully generated bindings for program: ${progHash}`)
  } else {
    console.log('ℹ️  No new programs to process')
  }
}

// Run the main function
main().catch(console.error)
