import type { Recipe, ServerItem, ServerItemList, ServerRecipe } from '@/lib/types'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

interface RecipeMappingConfig {
  sourceFile: string
  outputFile: string
  itemLookup: Record<number, string>
  itemIdLookup: Record<string, number>
  toolLookup: Record<number, string>
  buildingLookup: Record<number, string>
  professionLookup: Record<number, string>
  itemListLookup: Record<number, ServerItemList>
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
 * Load lookup tables by cross-referencing server data with converted data
 */
function loadLookupTables(
  __dirname: string,
  useSample: boolean
): {
  itemLookup: Record<number, string>
  itemIdLookup: Record<string, number>
  toolLookup: Record<number, string>
  buildingLookup: Record<number, string>
  professionLookup: Record<number, string>
  itemListLookup: Record<number, ServerItemList>
} {
  try {
    // Load converted item data
    const itemsPath = path.resolve(__dirname, '../../../src/data/items.json')
    const cargoPath = path.resolve(__dirname, '../../../src/data/cargo.json')
    const resourcesPath = path.resolve(__dirname, '../../../src/data/resources.json')

    const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))
    const cargo = JSON.parse(fs.readFileSync(cargoPath, 'utf-8'))
    const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf-8'))

    // Load server data for cross-referencing
    const sourceDir = getSourceDir(useSample, __dirname)
    const serverItemsPath = path.join(sourceDir, 'global/item_desc.json')
    const serverCargoPath = path.join(sourceDir, 'global/cargo_desc.json')
    const serverResourcesPath = path.join(sourceDir, 'global/resource_desc.json')
    const serverItemListPath = path.join(sourceDir, 'global/item_list_desc.json')

    const serverItems: ServerItem[] = JSON.parse(fs.readFileSync(serverItemsPath, 'utf-8'))
    const serverCargo = JSON.parse(fs.readFileSync(serverCargoPath, 'utf-8'))
    const serverResources = JSON.parse(fs.readFileSync(serverResourcesPath, 'utf-8'))
    const serverItemLists: ServerItemList[] = JSON.parse(fs.readFileSync(serverItemListPath, 'utf-8'))

    // Create lookup tables by matching names
    const itemLookup: Record<number, string> = {}
    const itemIdLookup: Record<string, number> = {}
    const toolLookup: Record<number, string> = {}
    const buildingLookup: Record<number, string> = {}
    const professionLookup: Record<number, string> = {}
    const itemListLookup: Record<number, ServerItemList> = {}

    // Build item list lookup
    for (const itemList of serverItemLists) {
      itemListLookup[itemList.id] = itemList
    }

    // Build item lookup by matching names between server and converted data
    console.log('🔍 Building item lookup tables...')

    // Helper function to find slug by name
    function findSlugByName(name: string, convertedData: { name: string; slug?: string }[]): string | null {
      const match = convertedData.find((item) => item.name === name)
      return match ? (match.slug ?? null) : null
    }

    // Build reverse lookup (slug -> id)
    for (const item of items) {
      itemIdLookup[item.slug] = item.id
    }
    for (const item of cargo) {
      itemIdLookup[item.slug] = item.id
    }
    for (const item of resources) {
      itemIdLookup[item.slug] = item.id
    }

    // Map server items to slugs (only for actual items, not recipe outputs)
    for (const serverItem of serverItems) {
      // Skip recipe outputs (they have "Output" in name and compendium_entry: false)
      if (serverItem.name.includes('Output') || !serverItem.compendium_entry) {
        continue
      }

      const slug = findSlugByName(serverItem.name, items)
      if (slug) {
        itemLookup[serverItem.id] = slug
        console.log(`✅ Mapped item: ${serverItem.name} (ID: ${serverItem.id}) -> ${slug}`)
      } else {
        console.log(`⚠️  No match found for item: ${serverItem.name} (ID: ${serverItem.id})`)
      }
    }

    // Map server cargo to slugs
    for (const serverCargoItem of serverCargo) {
      const slug = findSlugByName(serverCargoItem.name, cargo)
      if (slug) {
        itemLookup[serverCargoItem.id] = slug
        console.log(`✅ Mapped cargo: ${serverCargoItem.name} (ID: ${serverCargoItem.id}) -> ${slug}`)
      } else {
        console.log(`⚠️  No match found for cargo: ${serverCargoItem.name} (ID: ${serverCargoItem.id})`)
      }
    }

    // Map server resources to slugs
    for (const serverResource of serverResources) {
      const slug = findSlugByName(serverResource.name, resources)
      if (slug) {
        itemLookup[serverResource.id] = slug
        console.log(`✅ Mapped resource: ${serverResource.name} (ID: ${serverResource.id}) -> ${slug}`)
      } else {
        console.log(`⚠️  No match found for resource: ${serverResource.name} (ID: ${serverResource.id})`)
      }
    }

    console.log(`📊 Built item lookup with ${Object.keys(itemLookup).length} mappings`)
    console.log(`📊 Built item ID lookup with ${Object.keys(itemIdLookup).length} mappings`)
    console.log(`📊 Built item list lookup with ${Object.keys(itemListLookup).length} mappings`)

    // Load skill data for profession lookups
    const skillPath = path.join(sourceDir, 'global/skill_desc.json')
    const skills = JSON.parse(fs.readFileSync(skillPath, 'utf-8'))

    // Build profession lookup (skill ID -> skill name)
    for (const skill of skills) {
      professionLookup[skill.id] = skill.name.toLowerCase()
      console.log(`✅ Mapped profession: ${skill.name} (ID: ${skill.id})`)
    }

    // Load tool type data for tool lookups
    const toolTypePath = path.join(sourceDir, 'global/tool_type_desc.json')
    const toolTypes = JSON.parse(fs.readFileSync(toolTypePath, 'utf-8'))

    // Build tool lookup (tool_type ID -> tool name)
    for (const toolType of toolTypes) {
      toolLookup[toolType.id] = toolType.name.toLowerCase()
      console.log(`✅ Mapped tool: ${toolType.name} (ID: ${toolType.id})`)
    }

    // Load building data for building lookups
    const buildingPath = path.join(sourceDir, 'global/building_desc.json')
    const buildings = JSON.parse(fs.readFileSync(buildingPath, 'utf-8'))

    // Build building lookup (building ID -> building name)
    for (const building of buildings) {
      buildingLookup[building.id] = building.name.toLowerCase().replace(/\s+/g, '-')
      console.log(`✅ Mapped building: ${building.name} (ID: ${building.id})`)
    }

    return {
      itemLookup,
      itemIdLookup,
      toolLookup,
      buildingLookup,
      professionLookup,
      itemListLookup
    }
  } catch (error) {
    console.error('Error loading lookup tables:', error)
    return {
      itemLookup: {},
      itemIdLookup: {},
      toolLookup: {},
      buildingLookup: {},
      professionLookup: {},
      itemListLookup: {}
    }
  }
}

/**
 * Convert server recipe to frontend format
 */
function convertRecipe(serverRecipe: ServerRecipe, lookups: RecipeMappingConfig): Recipe {
  // Convert consumed items (materials) - use ID instead of slug
  const materials = serverRecipe.consumed_item_stacks.map(([itemId, qty]) => ({
    id: itemId, // Use the actual server item ID
    qty: qty || null
  }))

  // Convert crafted items (output) - use ID instead of slug
  const output: Array<{ item: number; qty: number | number[] | null }> = []

  for (const tuple of serverRecipe.crafted_item_stacks) {
    const [outputItemId, qty] = tuple
    // Check if this is a recipe output (has item_list_id)
    const outputItem = lookups.itemListLookup[outputItemId]

    if (outputItem) {
      // This is a recipe output, look up the actual items it produces
      for (const [, itemStacks] of outputItem.possibilities) {
        for (const [actualItemId, actualQty] of itemStacks) {
          output.push({
            item: actualItemId, // Use the actual server item ID
            qty: actualQty || null
          })
        }
      }
    } else {
      // This is a direct item output
      output.push({
        item: outputItemId, // Use the actual server item ID
        qty: qty || null
      })
    }
  }

  // Get profession from level requirements
  const profession = serverRecipe.level_requirements?.[0]?.[0]
  const professionSlug = profession ? lookups.professionLookup[profession] : 'unknown'

  // Get tool from tool requirements
  const tool = serverRecipe.tool_requirements?.[0]?.[0]
  const toolSlug = tool ? lookups.toolLookup[tool] : 'unknown'

  // Get building from building requirement
  const buildingType = serverRecipe.building_requirement?.[1]?.building_type
  const buildingSlug = buildingType ? lookups.buildingLookup[buildingType] : undefined

  return {
    id: serverRecipe.id,
    name: serverRecipe.name,
    requirements: {
      professions: professionSlug,
      tool: toolSlug,
      building: buildingSlug,
      materials
    },
    output
  }
}

/**
 * Process recipes from source file
 */
function processRecipes(config: RecipeMappingConfig): void {
  try {
    console.log(`📄 Processing recipes from: ${config.sourceFile}`)

    // Read source file
    const sourceContent = fs.readFileSync(config.sourceFile, 'utf-8')
    const serverRecipes: ServerRecipe[] = JSON.parse(sourceContent)

    console.log(`📊 Found ${serverRecipes.length} recipes to convert`)

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(config.outputFile)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
      console.log(`✅ Created output directory: ${outputDir}`)
    }

    // Convert all recipes
    const frontendRecipes: Recipe[] = []
    let processedCount = 0
    let errorCount = 0

    for (const serverRecipe of serverRecipes) {
      try {
        const frontendRecipe = convertRecipe(serverRecipe, config)
        frontendRecipes.push(frontendRecipe)
        processedCount++
        console.log(`✅ Converted: ${serverRecipe.name} (ID: ${serverRecipe.id})`)
      } catch (error) {
        errorCount++
        console.error(`❌ Error converting recipe ${serverRecipe.id}:`, error)
      }
    }

    // Write output file
    fs.writeFileSync(config.outputFile, JSON.stringify(frontendRecipes, null, 2), 'utf-8')

    console.log(`\n🎉 Recipe conversion completed!`)
    console.log(`✅ Successfully converted: ${processedCount} recipes`)
    console.log(`📄 Output file: ${config.outputFile}`)
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} recipes`)
    }
  } catch (error) {
    console.error(`💥 Error processing ${config.sourceFile}:`, error)
    throw error
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

  console.log('🚀 Starting recipe conversion...')
  console.log(`📁 Source directory: ${sourceDir}`)
  console.log(`📊 Using ${useSample ? 'sample' : 'real'} data`)
  console.log(`📁 Working directory: ${__dirname}`)

  // Load lookup tables
  const lookups = loadLookupTables(__dirname, useSample)

  // Configuration for recipe conversion
  const config: RecipeMappingConfig = {
    sourceFile: path.join(sourceDir, 'global/crafting_recipe_desc.json'),
    outputFile: path.resolve(__dirname, '../../../src/data/recipes.json'),
    ...lookups
  }

  // Process recipes
  processRecipes(config)

  console.log('\n🎉 Recipe conversion completed!')
}

// Run the script if it's executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
