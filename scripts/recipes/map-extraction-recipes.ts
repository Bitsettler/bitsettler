import type { Recipe } from '@/lib/types'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Server extraction recipe format (snake_case JSON)
interface ServerExtractionRecipe {
  id: number
  resource_id: number
  cargo_id: number
  discovery_triggers: number[]
  required_knowledges: number[]
  time_requirement: number
  stamina_requirement: number
  tool_durability_lost: number
  extracted_item_stacks: Array<[Array<[number, [number, number, any, any]]>, number]>
  consumed_item_stacks: Array<[number, number, any, number, number]>
  range: number
  tool_requirements: Array<[number, number, number]>
  allow_use_hands: boolean
  level_requirements: Array<[number, number]>
  experience_per_progress: Array<[number, number]>
  verb_phrase: string
  tool_mesh_index: number
  recipe_performance_id: number
}

interface ExtractionRecipeMappingConfig {
  sourceFile: string
  outputFile: string
  itemLookup: Record<number, string>
  itemIdLookup: Record<string, number>
  toolLookup: Record<number, string>
  professionLookup: Record<number, string>
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
  professionLookup: Record<number, string>
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

    const serverItems = JSON.parse(fs.readFileSync(serverItemsPath, 'utf-8'))
    const serverCargo = JSON.parse(fs.readFileSync(serverCargoPath, 'utf-8'))
    const serverResources = JSON.parse(fs.readFileSync(serverResourcesPath, 'utf-8'))

    // Create lookup tables by matching names
    const itemLookup: Record<number, string> = {}
    const itemIdLookup: Record<string, number> = {}
    const toolLookup: Record<number, string> = {}
    const professionLookup: Record<number, string> = {}

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

    return {
      itemLookup,
      itemIdLookup,
      toolLookup,
      professionLookup
    }
  } catch (error) {
    console.error('Error loading lookup tables:', error)
    return {
      itemLookup: {},
      itemIdLookup: {},
      toolLookup: {},
      professionLookup: {}
    }
  }
}

/**
 * Convert server extraction recipe to frontend format
 */
function convertExtractionRecipe(serverRecipe: ServerExtractionRecipe, lookups: ExtractionRecipeMappingConfig): Recipe {
  // Convert consumed items (materials) - use ID instead of slug
  const materials = serverRecipe.consumed_item_stacks.map(([itemId, quantity, , ,]) => ({
    id: itemId, // Use the actual server item ID
    qty: quantity || null
  }))

  // Convert extracted items (output) - use ID instead of slug
  const output: Array<{ item: number; qty: number | number[] | null; probability?: number }> = []

  for (const [itemStackData, probability] of serverRecipe.extracted_item_stacks) {
    // itemStackData is a single array like [0, [itemId, quantity, itemType, durability]]
    // Extract the item info from the nested structure
    const [, [itemId, quantity, ,]] = itemStackData

    output.push({
      item: itemId,
      qty: quantity || null,
      probability: probability // Include the drop rate/chance
    })
  }

  // Convert level requirements
  const levelRequirements = serverRecipe.level_requirements || []

  // Convert tool requirements
  const toolRequirements = serverRecipe.tool_requirements || []

  // Determine profession and tool
  let profession = 'any'
  let tool = 'hands'

  if (levelRequirements.length > 0) {
    const [professionId] = levelRequirements[0] // Get first profession requirement
    profession = lookups.professionLookup[professionId] || 'any'
  }

  if (toolRequirements.length > 0) {
    const [toolId] = toolRequirements[0] // Get first tool requirement
    tool = lookups.toolLookup[toolId] || 'hands'
  } else if (serverRecipe.allow_use_hands) {
    tool = 'hands'
  }

  return {
    id: serverRecipe.id,
    name: serverRecipe.verb_phrase,
    requirements: {
      professions: profession,
      tool: tool,
      materials: materials
    },
    output: output
  }
}

/**
 * Process extraction recipes from source file
 */
function processExtractionRecipes(config: ExtractionRecipeMappingConfig): void {
  try {
    console.log(`📄 Processing extraction recipes from: ${config.sourceFile}`)

    // Read source file
    const sourceContent = fs.readFileSync(config.sourceFile, 'utf-8')
    const serverRecipes: ServerExtractionRecipe[] = JSON.parse(sourceContent)

    console.log(`📊 Found ${serverRecipes.length} extraction recipes to convert`)

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
        const frontendRecipe = convertExtractionRecipe(serverRecipe, config)
        frontendRecipes.push(frontendRecipe)
        processedCount++
        console.log(`✅ Converted: ${serverRecipe.verb_phrase || serverRecipe.id} (ID: ${serverRecipe.id})`)
      } catch (error) {
        errorCount++
        console.error(`❌ Error converting extraction recipe ${serverRecipe.id}:`, error)
      }
    }

    // Write output file
    fs.writeFileSync(config.outputFile, JSON.stringify(frontendRecipes, null, 2), 'utf-8')

    console.log(`\n🎉 Extraction recipe conversion completed!`)
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

  console.log('🚀 Starting extraction recipe conversion...')
  console.log(`📁 Source directory: ${sourceDir}`)
  console.log(`📊 Using ${useSample ? 'sample' : 'real'} data`)
  console.log(`📁 Working directory: ${__dirname}`)

  // Load lookup tables
  const lookups = loadLookupTables(__dirname, useSample)

  // Configuration for extraction recipe conversion
  const config: ExtractionRecipeMappingConfig = {
    sourceFile: path.join(sourceDir, 'global/extraction_recipe_desc.json'),
    outputFile: path.resolve(__dirname, '../../src/data/extraction-recipes.json'),
    ...lookups
  }

  // Process extraction recipes
  processExtractionRecipes(config)

  console.log('\n🎉 Extraction recipe conversion completed!')
}

// Run the script if it's executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
