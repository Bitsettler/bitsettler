import type { BiomeDesc } from '@/data/bindings/biome_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import type { ResourcePlacementRecipeDesc } from '@/data/bindings/resource_placement_recipe_desc_type'
import biomeDescData from '@/data/global/biome_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import resourcePlacementRecipeDescData from '@/data/global/resource_placement_recipe_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import cargoDescData from '@/data/global/cargo_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Types for item and cargo data
interface ItemDesc {
  id: number
  name: string
  description: string
  [key: string]: unknown
}

interface CargoDesc {
  id: number
  name: string
  description: string
  [key: string]: unknown
}

// Combined resource data with computed properties and biome information
export interface ResourceWithStats extends ResourceDesc {
  resourceCategory: string
  isHarvestable: boolean
  isNaturallyOccurring: boolean
  isRespawning: boolean
  isFlattenable: boolean
  healthCategory: string
  availableBiomes: string[]
  biomeDetails: BiomeWithInfo[]
  primaryBiome: string
  yieldDescription: string
}

// Enriched biome information
interface BiomeWithInfo {
  name: string
  description: string
  hazardLevel: string
  biomeType: number
}

/**
 * Get resource-related data from static JSON files
 */
function getResourceData() {
  return {
    resourceDesc: camelCaseDeep<ResourceDesc[]>(resourceDescData),
    biomeDesc: camelCaseDeep<BiomeDesc[]>(biomeDescData),
    resourcePlacementRecipeDesc: camelCaseDeep<ResourcePlacementRecipeDesc[]>(resourcePlacementRecipeDescData),
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    cargoDesc: camelCaseDeep<CargoDesc[]>(cargoDescData)
  }
}

/**
 * Get resource category based on tag and properties
 */
function getResourceCategory(tag: string, flattenable: boolean): string {
  const categoryMapping: Record<string, string> = {
    'Tree': 'Trees & Lumber',
    'Wood Logs': 'Trees & Lumber',
    'Sapling': 'Trees & Lumber',
    'Stick': 'Trees & Lumber',
    'Stump': 'Trees & Lumber',
    'Berry': 'Forage & Plants',
    'Fruit': 'Forage & Plants',
    'Flower': 'Forage & Plants',
    'Mushroom': 'Forage & Plants',
    'Fiber Plant': 'Forage & Plants',
    'Wild Grain': 'Forage & Plants',
    'Wild Vegetable': 'Forage & Plants',
    'Insects': 'Forage & Plants',
    'Rock': 'Minerals & Stone',
    'Rock Boulder': 'Minerals & Stone',
    'Rock Outcrop': 'Minerals & Stone',
    'Clay': 'Minerals & Stone',
    'Sand': 'Minerals & Stone',
    'Salt': 'Minerals & Stone',
    'Ore Vein': 'Minerals & Stone',
    'Metal Outcrop': 'Minerals & Stone',
    'Ocean Fish School': 'Aquatic Resources',
    'Lake Fish School': 'Aquatic Resources',
    'Chummed Ocean Fish School': 'Aquatic Resources',
    'Baitfish': 'Aquatic Resources',
    'Mollusks': 'Aquatic Resources',
    'Monster Den': 'Special Resources',
    'Wonder Resource': 'Special Resources',
    'Energy Font': 'Special Resources',
    'Research': 'Special Resources',
    'Note': 'Special Resources',
    'Bones': 'Special Resources',
    'Door': 'Interactive Objects',
    'Obstacle': 'Interactive Objects',
    'Depleted Resource': 'Interactive Objects'
  }
  
  const category = categoryMapping[tag]
  if (category) return category
  
  // Fallback categorization based on properties
  if (flattenable) return 'Interactive Objects'
  return 'Other Resources'
}

/**
 * Get health category based on maxHealth
 */
function getHealthCategory(maxHealth: number): string {
  if (maxHealth <= 0) return 'Indestructible'
  if (maxHealth <= 50) return 'Fragile'
  if (maxHealth <= 200) return 'Moderate'
  if (maxHealth <= 500) return 'Sturdy'
  return 'Very Sturdy'
}

/**
 * Check if resource is harvestable (has yield)
 */
function isHarvestable(onDestroyYield: unknown[]): boolean {
  return Array.isArray(onDestroyYield) && onDestroyYield.length > 0
}

/**
 * Check if resource is naturally occurring (not planted/crafted)
 */
function isNaturallyOccurring(tag: string): boolean {
  const naturalTags = [
    'Tree', 'Berry', 'Fruit', 'Flower', 'Mushroom', 'Fiber Plant', 'Wild Grain', 'Wild Vegetable',
    'Rock', 'Rock Boulder', 'Rock Outcrop', 'Clay', 'Sand', 'Salt', 'Ore Vein', 'Metal Outcrop',
    'Ocean Fish School', 'Lake Fish School', 'Baitfish', 'Mollusks', 'Insects', 'Monster Den',
    'Wonder Resource', 'Energy Font', 'Bones'
  ]
  return naturalTags.includes(tag)
}

/**
 * Get yield description from onDestroyYield data
 */
function getYieldDescription(onDestroyYield: unknown[], itemDesc: ItemDesc[], cargoDesc: CargoDesc[]): string {
  if (!Array.isArray(onDestroyYield) || onDestroyYield.length === 0) {
    return 'No yield'
  }
  
  // Track yields by item ID to consolidate quantities
  const yieldMap = new Map<number, { name: string; totalQuantity: number }>()
  
  for (const yieldEntry of onDestroyYield) {
    if (!Array.isArray(yieldEntry) || yieldEntry.length < 2) {
      continue
    }
    
    const [itemId, quantity] = yieldEntry
    if (typeof itemId !== 'number' || typeof quantity !== 'number') {
      continue
    }
    
    // Look up item name in items first, then cargo
    let itemName = null
    const item = itemDesc.find(item => item.id === itemId)
    if (item) {
      itemName = item.name
    } else {
      const cargo = cargoDesc.find(cargo => cargo.id === itemId)
      if (cargo) {
        itemName = cargo.name
      }
    }
    
    if (itemName) {
      if (yieldMap.has(itemId)) {
        const existing = yieldMap.get(itemId)!
        existing.totalQuantity += quantity
      } else {
        yieldMap.set(itemId, { name: itemName, totalQuantity: quantity })
      }
    } else {
      // Handle unknown items separately to avoid conflicts
      const unknownKey = -itemId // Use negative to avoid conflicts
      const unknownName = `Unknown Item (ID: ${itemId})`
      if (yieldMap.has(unknownKey)) {
        const existing = yieldMap.get(unknownKey)!
        existing.totalQuantity += quantity
      } else {
        yieldMap.set(unknownKey, { name: unknownName, totalQuantity: quantity })
      }
    }
  }
  
  if (yieldMap.size === 0) {
    return 'No valid yields'
  }
  
  // Convert to formatted strings
  const yieldItems = Array.from(yieldMap.values()).map(
    ({ name, totalQuantity }) => `${totalQuantity}x ${name}`
  )
  
  return yieldItems.join(', ')
}

/**
 * Get biome information for a resource by cross-referencing placement recipes and custom mapping
 */
function getResourceBiomes(
  resourceId: number, 
  resourceTag: string,
  resourcePlacementRecipes: ResourcePlacementRecipeDesc[], 
  biomeDescs: BiomeDesc[]
): { availableBiomes: string[], biomeDetails: BiomeWithInfo[], primaryBiome: string } {
  
  // Find placement recipes that reference this resource
  const placementRecipes = resourcePlacementRecipes.filter(
    recipe => recipe.resourceDescriptionId === resourceId
  )
  
  // Extract unique biome types from all placement recipes
  const biomeTypes = new Set<number>()
  placementRecipes.forEach(recipe => {
    if (Array.isArray(recipe.requiredBiomes)) {
      recipe.requiredBiomes.forEach((biome: unknown) => {
        // Handle biome data structure - could be array format or object format
        if (Array.isArray(biome) && biome.length > 0 && typeof biome[0] === 'number') {
          biomeTypes.add(biome[0])
        } else if (typeof biome === 'object' && biome !== null && 'tag' in biome) {
          // If it's a tagged union, we'd need to map tag to biome type
          // For now, we'll skip this case
        }
      })
    }
  })
  
  // Map biome types to biome descriptions
  const biomeDetails: BiomeWithInfo[] = []
  const availableBiomes: string[] = []
  
  biomeTypes.forEach(biomeType => {
    const biomeDesc = biomeDescs.find(desc => desc.biomeType === biomeType)
    if (biomeDesc) {
      biomeDetails.push({
        name: biomeDesc.name,
        description: biomeDesc.description,
        hazardLevel: biomeDesc.hazardLevel,
        biomeType: biomeDesc.biomeType
      })
      availableBiomes.push(biomeDesc.name)
    }
  })
  
  // Note: Natural resource biome data is not available in static game exports
  // Only planted resource biomes are available via resource_placement_recipe_desc
  
  // Determine primary biome (first one, or most common)
  const primaryBiome = availableBiomes.length > 0 ? availableBiomes[0] : 'Unknown'
  
  return { availableBiomes, biomeDetails, primaryBiome }
}

/**
 * Get all resource items from static data
 */
export async function getResourceItems(): Promise<ResourceDesc[]> {
  const { resourceDesc } = getResourceData()
  return resourceDesc.filter(resource => resource.compendiumEntry)
}

/**
 * Get resources with computed properties, biome data, and enriched information
 */
export async function getResourcesWithStats(): Promise<ResourceWithStats[]> {
  const { resourceDesc, biomeDesc, resourcePlacementRecipeDesc, itemDesc, cargoDesc } = getResourceData()
  const results: ResourceWithStats[] = []

  const compendiumResources = resourceDesc.filter(resource => resource.compendiumEntry)

  for (const resource of compendiumResources) {
    // Calculate computed properties
    const resourceCategory = getResourceCategory(resource.tag, resource.flattenable)
    const isHarvestableResource = isHarvestable(resource.onDestroyYield)
    const isNaturallyOccurringResource = isNaturallyOccurring(resource.tag)
    const isRespawning = !resource.notRespawning
    const isFlattenable = resource.flattenable
    const healthCategory = getHealthCategory(resource.maxHealth)
    const yieldDescription = getYieldDescription(resource.onDestroyYield, itemDesc, cargoDesc)
    
    // Get biome information
    const { availableBiomes, biomeDetails, primaryBiome } = getResourceBiomes(
      resource.id, 
      resource.tag,
      resourcePlacementRecipeDesc, 
      biomeDesc
    )

    results.push({
      ...resource,
      resourceCategory,
      isHarvestable: isHarvestableResource,
      isNaturallyOccurring: isNaturallyOccurringResource,
      isRespawning,
      isFlattenable,
      healthCategory,
      availableBiomes,
      biomeDetails,
      primaryBiome,
      yieldDescription
    })
  }

  return results
}

/**
 * Alias for consistency with other modules
 */
export async function getResourcesWithItems(): Promise<ResourceWithStats[]> {
  return getResourcesWithStats()
}

/**
 * Get resources grouped by tag, sorted by tier then by name
 */
export async function getResourcesGroupedByTag(): Promise<Record<string, ResourceWithStats[]>> {
  const resources = await getResourcesWithStats()

  const grouped: Record<string, ResourceWithStats[]> = {}

  for (const resource of resources) {
    const tag = resource.tag
    if (!grouped[tag]) {
      grouped[tag] = []
    }
    grouped[tag].push(resource)
  }

  // Sort each group by tier, then by name
  for (const tag in grouped) {
    grouped[tag].sort((a, b) => {
      // First sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Then sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get resources grouped by category
 */
export async function getResourcesGroupedByCategory(): Promise<Record<string, ResourceWithStats[]>> {
  const resources = await getResourcesWithStats()

  const grouped: Record<string, ResourceWithStats[]> = {}

  for (const resource of resources) {
    const category = resource.resourceCategory
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(resource)
  }

  // Sort each group by tag, then by tier, then by name
  for (const category in grouped) {
    grouped[category].sort((a, b) => {
      // First sort by tag
      if (a.tag !== b.tag) {
        return a.tag.localeCompare(b.tag)
      }
      // Then sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Finally sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get resources grouped by biome
 */
export async function getResourcesGroupedByBiome(): Promise<Record<string, ResourceWithStats[]>> {
  const resources = await getResourcesWithStats()

  const grouped: Record<string, ResourceWithStats[]> = {}

  for (const resource of resources) {
    // Add resource to each biome it's found in
    resource.availableBiomes.forEach(biome => {
      if (!grouped[biome]) {
        grouped[biome] = []
      }
      grouped[biome].push(resource)
    })
    
    // If resource has no biomes, add to "Unknown" category
    if (resource.availableBiomes.length === 0) {
      if (!grouped['Unknown']) {
        grouped['Unknown'] = []
      }
      grouped['Unknown'].push(resource)
    }
  }

  // Sort each group by category, then by tier, then by name
  for (const biome in grouped) {
    grouped[biome].sort((a, b) => {
      // First sort by category
      if (a.resourceCategory !== b.resourceCategory) {
        return a.resourceCategory.localeCompare(b.resourceCategory)
      }
      // Then sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Finally sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get resource statistics overview with enhanced analysis
 */
export async function getResourceStatistics() {
  const resources = await getResourcesWithStats()
  const resourcesByTag = await getResourcesGroupedByTag()
  const resourcesByCategory = await getResourcesGroupedByCategory()
  const resourcesByBiome = await getResourcesGroupedByBiome()

  const totalResources = resources.length
  const tagCount = Object.keys(resourcesByTag).length
  const categoryCount = Object.keys(resourcesByCategory).length
  const biomeCount = Object.keys(resourcesByBiome).length

  // Calculate tier distribution
  const tierDistribution: Record<number, number> = {}
  resources.forEach((resource) => {
    tierDistribution[resource.tier] = (tierDistribution[resource.tier] || 0) + 1
  })

  // Calculate rarity distribution
  const rarityDistribution: Record<string, number> = {}
  resources.forEach((resource) => {
    const rarity = resource.rarity?.tag || 'Unknown'
    rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1
  })

  // Calculate category distribution
  const categoryDistribution: Record<string, number> = {}
  resources.forEach((resource) => {
    categoryDistribution[resource.resourceCategory] = 
      (categoryDistribution[resource.resourceCategory] || 0) + 1
  })

  // Calculate health distribution
  const healthDistribution: Record<string, number> = {}
  resources.forEach((resource) => {
    healthDistribution[resource.healthCategory] = 
      (healthDistribution[resource.healthCategory] || 0) + 1
  })

  // Calculate type counts
  const harvestableCount = resources.filter(r => r.isHarvestable).length
  const naturalCount = resources.filter(r => r.isNaturallyOccurring).length
  const respawningCount = resources.filter(r => r.isRespawning).length
  const flattenableCount = resources.filter(r => r.isFlattenable).length

  // Calculate health statistics
  const healthValues = resources.map(r => r.maxHealth).filter(h => h > 0)
  const healthStats = healthValues.length > 0 ? {
    minHealth: Math.min(...healthValues),
    maxHealth: Math.max(...healthValues),
    avgHealth: Math.round(healthValues.reduce((sum, h) => sum + h, 0) / healthValues.length)
  } : {
    minHealth: 0,
    maxHealth: 0,
    avgHealth: 0
  }

  // Calculate biome coverage statistics
  const biomeCoverage: Record<string, number> = {}
  resources.forEach((resource) => {
    resource.availableBiomes.forEach(biome => {
      biomeCoverage[biome] = (biomeCoverage[biome] || 0) + 1
    })
  })

  return {
    total: totalResources,
    tags: tagCount,
    categories: categoryCount,
    biomes: biomeCount,
    harvestableCount,
    naturalCount,
    respawningCount,
    flattenableCount,
    tierDistribution,
    rarityDistribution,
    categoryDistribution,
    healthDistribution,
    healthStats,
    biomeCoverage,
    resourcesByTag: Object.entries(resourcesByTag).map(([tag, resourceList]) => ({
      tag,
      count: resourceList.length,
      category: resourceList[0]?.resourceCategory || 'Unknown',
      primaryBiome: resourceList[0]?.primaryBiome || 'Unknown',
      avgHealth: resourceList.length > 0 ? 
        Math.round(resourceList.reduce((sum, r) => sum + r.maxHealth, 0) / resourceList.length) : 0
    })),
    resourcesByCategory: Object.entries(resourcesByCategory).map(([category, resourceList]) => ({
      category,
      count: resourceList.length,
      avgTier: resourceList.length > 0 ? 
        Math.round(resourceList.reduce((sum, r) => sum + r.tier, 0) / resourceList.length) : 0,
      harvestableCount: resourceList.filter(r => r.isHarvestable).length
    })),
    resourcesByBiome: Object.entries(resourcesByBiome).map(([biome, resourceList]) => ({
      biome,
      count: resourceList.length,
      categoryCount: new Set(resourceList.map(r => r.resourceCategory)).size
    }))
  }
}