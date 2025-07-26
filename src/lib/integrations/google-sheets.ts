export interface BiomeResourceMap {
  [biome: string]: {
    [resourceType: string]: string[] // Available tiers
  }
}

/**
 * Fetch community resource-biome data from live Google Sheets or fallback to local CSV
 */
export async function fetchCommunityBiomeData(): Promise<BiomeResourceMap> {
  try {
    // Try to fetch from live Google Sheets first
    const csvText = await fetchFromGoogleSheets()
    return parseCommunityCSV(csvText)
  } catch (error) {
    console.warn('Failed to fetch from Google Sheets, falling back to local CSV:', error)

    try {
      // Fallback to local CSV file
      const csvPath = '/src/data/crowd-sourced/Bitcraft Biome Diversity - Biome Diversity.csv'
      const fs = await import('fs/promises')
      const path = await import('path')

      const filePath = path.join(process.cwd(), csvPath)
      const csvText = await fs.readFile(filePath, 'utf-8')
      return parseCommunityCSV(csvText)
    } catch (fallbackError) {
      console.warn('Failed to fetch community biome data from both live and local sources:', fallbackError)
      return {}
    }
  }
}

/**
 * Fetch CSV data directly from Google Sheets
 */
async function fetchFromGoogleSheets(): Promise<string> {
  // Convert the Google Sheets URL to CSV export format
  const sheetId = '1ARJoeKVgv2AQuyGeF5cjU2RKkPajfVr6f3dogXup0Y8'
  const gid = '0' // First sheet
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`

  const response = await fetch(csvUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; BitcraftGuide/1.0)'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheets CSV: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

/**
 * Parse the community CSV data into structured biome-resource mappings
 */
function parseCommunityCSV(csvText: string): BiomeResourceMap {
  const lines = csvText.split('\n')
  const biomeMap: BiomeResourceMap = {}

  // Resource type column positions (based on CSV structure analysis)
  const RESOURCE_COLUMNS = {
    Flower: 0,
    Mushroom: 1,
    Berry: 2,
    'Bait Fish': 3,
    'Lake Fish': 4,
    Animal: 5,
    Fiber: 6,
    Ore: 7,
    Wood: 8,
    Stone: 9,
    Glyph: 10,
    Sand: 11,
    Clay: 12,
    Monster: 13,
    'Unique Resource': 14
  }

  let currentBiome = ''
  let inBiomeSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cells = parseCSVLine(line)

    // Check if this is a biome header line
    if (isBiomeHeader(cells[0])) {
      currentBiome = cleanBiomeName(cells[0])
      biomeMap[currentBiome] = {}
      inBiomeSection = true
      continue
    }

    // Skip the column headers row (Flower, Mushroom, Berry, etc.)
    if (inBiomeSection && isResourceTypeRow(cells)) {
      continue
    }

    // Process tier rows when we're in a biome section
    // Tier rows can have the tier identifier in first column (T1, T2, etc.) or be inferred from content pattern
    let tier: string | null = null

    // Check if first cell explicitly contains tier
    if (inBiomeSection && currentBiome && cells[0] && cells[0].match(/^T\d+$/)) {
      tier = cells[0]
    }
    // Or check if this looks like a tier row based on content pattern (T1, T2 in multiple columns)
    else if (inBiomeSection && currentBiome && cells.length > 8) {
      // Look for tier patterns in the data columns (multiple T1, T2, etc.)
      const tierMatches = cells.slice(0, 15).filter((cell) => cell && cell.match(/^T\d+$/))
      if (tierMatches.length >= 1) {
        // Changed from >= 3 to >= 1 to catch single T1 entries
        // Use the most common tier in this row
        const tierCounts: Record<string, number> = {}
        tierMatches.forEach((t) => (tierCounts[t] = (tierCounts[t] || 0) + 1))
        tier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0][0]

        // Optional debug for single tier matches
        // console.log(`Single tier match in ${currentBiome}: ${tierMatches}`)
      }
    }

    if (tier) {
      // Optional debug for development
      // console.log(`Processing ${tier} row in ${currentBiome}`)

      // Check each resource column for tier availability
      Object.entries(RESOURCE_COLUMNS).forEach(([resourceType, columnIndex]) => {
        const cellValue = cells[columnIndex]

        // If the cell contains the tier (T1, T2, etc.), this resource is available
        if (cellValue && cellValue.trim() === tier) {
          if (!biomeMap[currentBiome][resourceType]) {
            biomeMap[currentBiome][resourceType] = []
          }

          if (!biomeMap[currentBiome][resourceType].includes(tier)) {
            biomeMap[currentBiome][resourceType].push(tier)

            // Track resource discoveries for debugging if needed
            // console.log(`Found ${tier} ${resourceType} in biome: "${currentBiome}"`)
          }
        }
      })
    }

    // End biome section when we hit another biome or multiple consecutive empty lines
    // Don't end on single empty rows as they might be tier rows with empty first column
    if (inBiomeSection && !cells[0]) {
      const hasContent = cells.some((cell) => cell && cell.trim().length > 0)

      // Only end if this row has no content
      if (!hasContent) {
        inBiomeSection = false
      }
    }
  }

  // Debug biome detection (uncomment for development)
  // console.log('Detected biomes:', Object.keys(biomeMap).sort())
  // console.log('T1 Wood biomes:', Object.entries(biomeMap)
  //   .filter(([, resources]) => resources.Wood && resources.Wood.includes('T1'))
  //   .map(([biome]) => biome).sort())

  return biomeMap
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result.map((cell) => cell.trim())
}

/**
 * Normalize biome names to match database naming conventions
 */
export function normalizeBiomeName(biomeName: string): string {
  const nameMapping: Record<string, string> = {
    'pine forest': 'Pine Woods',
    'pine woods': 'Pine Woods'
  }

  const lowerName = biomeName.toLowerCase().trim()
  const mappedName = nameMapping[lowerName]

  if (mappedName) {
    return mappedName
  }

  // Default: title case conversion
  return biomeName
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Check if a cell value indicates a biome header
 */
function isBiomeHeader(cell: string): boolean {
  if (!cell) return false

  const biomeNames = [
    'breezy grasslands',
    'calm forest',
    'pine woods',
    'pine forest',
    'snowy peaks',
    'autumn forest',
    'misty tundra',
    'desert wasteland',
    'swamp',
    'rocky garden',
    'open ocean',
    'safe meadows',
    'cave',
    'jungle',
    'sapwoods'
  ]

  const lowerCell = cell.toLowerCase()
  return (
    biomeNames.some((biome) => lowerCell.includes(biome)) ||
    lowerCell.includes('biome') ||
    lowerCell.includes('grassland') ||
    lowerCell.includes('forest') ||
    lowerCell.includes('desert') ||
    lowerCell.includes('ocean')
  )
}

/**
 * Check if a row contains resource type headers
 */
function isResourceTypeRow(cells: string[]): boolean {
  // Check for the specific header pattern:
  // - First few cells should contain resource type names, not tier identifiers
  // - Should not match if cells contain only tier patterns like T1, T2

  // If the first cell is a tier (T1, T2, etc.), this is definitely not a header row
  if (cells[0] && cells[0].match(/^T\d+$/)) {
    return false
  }

  // Look for actual resource type keywords in the expected header positions
  const expectedHeaders = [
    'flower',
    'mushroom',
    'berry',
    'bait fish',
    'lake fish',
    'animal',
    'fiber',
    'ore',
    'wood',
    'stone',
    'glyph',
    'sand',
    'clay',
    'monster',
    'unique resource'
  ]

  // Count how many cells match expected header names
  let headerMatches = 0
  for (let i = 0; i < Math.min(cells.length, 15); i++) {
    const cell = cells[i].toLowerCase().trim()
    if (expectedHeaders.includes(cell)) {
      headerMatches++
    }
  }

  // If we have at least 5 header matches, this is likely a header row
  return headerMatches >= 5
}

/**
 * Clean biome name for consistency
 */
function cleanBiomeName(rawName: string): string {
  const cleaned = rawName
    .replace(/biome/gi, '')
    .replace(/[^\w\s]/g, '')
    .trim()

  return normalizeBiomeName(cleaned)
}

/**
 * Map community resource types to our game tags
 */
export function mapCommunityResourceToGameTag(communityType: string): string[] {
  const mapping: Record<string, string[]> = {
    flowers: ['Flower'],
    mushrooms: ['Mushroom'],
    berries: ['Berry', 'Fruit'],
    'bait fish': ['Baitfish'],
    'lake fish': ['Lake Fish School'],
    animals: ['Animal'], // This might need more specific mapping
    fiber: ['Fiber Plant'],
    ore: ['Ore Vein', 'Metal Outcrop'],
    wood: ['Tree', 'Wood Logs'],
    stone: ['Rock', 'Rock Boulder', 'Rock Outcrop'],
    clay: ['Clay'],
    sand: ['Sand']
  }

  const lowerType = communityType.toLowerCase()
  return mapping[lowerType] || []
}

/**
 * Get biomes for a specific game resource based on its tier using community data
 */
export function getBiomesForResourceTag(
  resourceTag: string,
  resourceTier: number,
  communityData: BiomeResourceMap
): string[] {
  const biomes: string[] = []
  const communityTier = `T${resourceTier}`

  // Map our game resource tag to community resource type
  const communityType = mapGameTagToCommunityResource(resourceTag)
  if (!communityType) return biomes

  // Find biomes where this resource type and tier are available
  for (const [biome, resources] of Object.entries(communityData)) {
    if (resources[communityType] && resources[communityType].includes(communityTier)) {
      biomes.push(biome)
    }
  }

  return biomes
}

/**
 * Map our game resource tags to community resource types (reverse mapping)
 */
function mapGameTagToCommunityResource(gameTag: string): string | null {
  const gameTagMapping: Record<string, string | null> = {
    // Trees & Lumber
    Tree: 'Wood',
    'Wood Logs': 'Wood',
    Sapling: 'Wood',
    Stick: 'Wood',
    Stump: 'Wood',

    // Forage & Plants
    Berry: 'Berry',
    Fruit: 'Berry',
    Flower: 'Flower',
    Mushroom: 'Mushroom',
    'Fiber Plant': 'Fiber',
    'Wild Grain': 'Fiber',
    'Wild Vegetable': 'Fiber',

    // Minerals & Stone
    Rock: 'Stone',
    'Rock Boulder': 'Stone',
    'Rock Outcrop': 'Stone',
    Clay: 'Clay',
    Sand: 'Sand',
    Salt: 'Stone', // Salt might be in stone category
    'Ore Vein': 'Ore',
    'Metal Outcrop': 'Ore',

    // Aquatic Resources
    'Ocean Fish School': 'Bait Fish', // or Lake Fish depending on context
    'Lake Fish School': 'Lake Fish',
    'Chummed Ocean Fish School': 'Bait Fish',
    Baitfish: 'Bait Fish',
    Mollusks: 'Lake Fish', // Might need adjustment

    // Special Resources - these might not map directly
    'Monster Den': 'Monster',
    'Wonder Resource': 'Unique Resource',
    'Energy Font': 'Unique Resource',
    Research: 'Glyph',
    Note: 'Unique Resource',
    Bones: 'Unique Resource',

    // Interactive Objects - these probably don't have biome data
    Door: null,
    Obstacle: null,
    'Depleted Resource': null
  }

  return gameTagMapping[gameTag] || null
}
