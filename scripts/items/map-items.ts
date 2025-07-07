import type { ServerItem } from '@/lib/types'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

interface FrontendItem {
  id: string
  name: string
  slug: string
  tier: number
  rarity: string
  category: string
  description: string
}

interface ItemMappingConfig {
  sourceFile: string
  outputDir: string
  category: string
  outputFileName: string
}

/**
 * Convert rarity number to string
 */
function mapRarity(rarityArr: [number, Record<string, unknown>]): string {
  const rarityMap: Record<number, string> = {
    1: 'common',
    2: 'uncommon',
    3: 'rare',
    4: 'epic',
    5: 'legendary',
    6: 'mythic'
  }
  return rarityMap[rarityArr[0]] || 'common'
}

/**
 * Convert name to slug
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Convert server item to frontend format
 */
function convertItem(serverItem: ServerItem, category: string): FrontendItem {
  // Add category prefix to ID to avoid collisions (category is already singular)
  const prefixedId = `${category}_${serverItem.id}`

  return {
    id: prefixedId,
    name: serverItem.name,
    slug: toSlug(serverItem.name),
    tier: serverItem.tier,
    rarity: mapRarity(serverItem.rarity),
    category,
    description: serverItem.description || 'No description available'
  }
}

/**
 * Check if an item should be filtered out (recipes, etc.)
 */
function shouldFilterItem(serverItem: ServerItem): boolean {
  // Only filter out items with "Output" suffix
  // These are typically recipe outputs rather than actual items
  return serverItem.name.includes('Output')
}

/**
 * Process items from a source file
 */
function processItems(config: ItemMappingConfig): void {
  try {
    console.log(`📄 Processing items from: ${config.sourceFile}`)

    // Read source file
    const sourceContent = fs.readFileSync(config.sourceFile, 'utf-8')
    const serverItems: ServerItem[] = JSON.parse(sourceContent)

    console.log(`📊 Found ${serverItems.length} items to convert`)

    // Create output directory if it doesn't exist
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true })
      console.log(`✅ Created output directory: ${config.outputDir}`)
    }

    // Convert all items to frontend format
    const frontendItems: FrontendItem[] = []
    let processedCount = 0
    let errorCount = 0
    let filteredCount = 0

    for (const serverItem of serverItems) {
      try {
        if (shouldFilterItem(serverItem)) {
          console.log(`❌ Skipping filtered item: ${serverItem.name}`)
          filteredCount++
          continue
        }
        const frontendItem = convertItem(serverItem, config.category)
        frontendItems.push(frontendItem)
        processedCount++
        console.log(`✅ Converted: ${serverItem.name}`)
      } catch (error) {
        errorCount++
        console.error(`❌ Error converting ${serverItem.name}:`, error)
      }
    }

    // Sort items alphabetically by name
    frontendItems.sort((a, b) => a.name.localeCompare(b.name))

    // Write single JSON file for the category
    const outputPath = path.join(config.outputDir, config.outputFileName)
    fs.writeFileSync(outputPath, JSON.stringify(frontendItems, null, 2), 'utf-8')

    console.log(`\n🎉 Item conversion completed for ${config.category}!`)
    console.log(`✅ Successfully converted: ${processedCount} items`)
    console.log(`📄 Output file: ${outputPath}`)
    if (filteredCount > 0) {
      console.log(`🚫 Filtered out: ${filteredCount} items (recipes/outputs)`)
    }
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} items`)
    }
  } catch (error) {
    console.error(`💥 Error processing ${config.sourceFile}:`, error)
    throw error
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): { useSample: boolean } {
  const args = process.argv.slice(2)
  const useSample = args.includes('--sample')
  return { useSample }
}

/**
 * Get source directory based on arguments
 */
function getSourceDir(useSample: boolean, __dirname: string): string {
  const workspaceRoot = path.resolve(__dirname, '../../')

  if (useSample) {
    return path.join(workspaceRoot, 'data/sample')
  } else {
    // Use the new @/data directory
    return path.join(workspaceRoot, 'src/data')
  }
}

/**
 * Main execution function
 */
function main(): void {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  // Parse command line arguments
  const { useSample } = parseArgs()
  const sourceDir = getSourceDir(useSample, __dirname)

  console.log('🚀 Starting item conversion...')
  console.log(`📁 Source directory: ${sourceDir}`)
  console.log(`📊 Using ${useSample ? 'sample' : 'real'} data`)
  console.log(`📁 Working directory: ${__dirname}`)

  // Configuration for different item types
  const configs: ItemMappingConfig[] = [
    {
      sourceFile: path.join(sourceDir, 'global/item_desc.json'),
      outputDir: path.resolve(__dirname, '../../src/data'),
      category: 'item',
      outputFileName: 'items.json'
    },
    {
      sourceFile: path.join(sourceDir, 'global/cargo_desc.json'),
      outputDir: path.resolve(__dirname, '../../src/data'),
      category: 'cargo',
      outputFileName: 'cargo.json'
    },
    {
      sourceFile: path.join(sourceDir, 'global/resource_desc.json'),
      outputDir: path.resolve(__dirname, '../../src/data'),
      category: 'resource',
      outputFileName: 'resources.json'
    }
  ]

  // Process each item type
  for (const config of configs) {
    console.log(`\n📦 Processing ${config.category}...`)
    processItems(config)
  }

  console.log('\n🎉 All item conversions completed!')
}

// Run the script if it's executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
