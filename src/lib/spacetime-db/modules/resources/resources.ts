import type { BiomeDesc } from '@/data/bindings/biome_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemListDesc } from '@/data/bindings/item_list_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import type { ResourcePlacementRecipeDesc } from '@/data/bindings/resource_placement_recipe_desc_type'
import biomeDescData from '@/data/global/biome_desc.json'
import cargoDescData from '@/data/global/cargo_desc.json'
import extractionRecipeDescData from '@/data/global/extraction_recipe_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import itemListDescData from '@/data/global/item_list_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import resourcePlacementRecipeDescData from '@/data/global/resource_placement_recipe_desc.json'
import {
  fetchCommunityBiomeData,
  getBiomesForResourceTag as getCommunityBiomesForTag,
  normalizeBiomeName
} from '@/lib/integrations/google-sheets'
import { ResourceTag } from '@/lib/spacetime-db/modules/resources/resource-tags'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'

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
  availableBiomes: string[]
  biomeDetails: BiomeWithInfo[]
  primaryBiome: string
  yieldDescription: string
  destroyYieldDescription: string
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
    extractionRecipeDesc: camelCaseDeep<ExtractionRecipeDesc[]>(extractionRecipeDescData),
    itemListDesc: camelCaseDeep<ItemListDesc[]>(itemListDescData),
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    cargoDesc: camelCaseDeep<CargoDesc[]>(cargoDescData)
  }
}

/**
 * Get resource category based on tag and properties
 */
function getResourceCategory(tag: string, flattenable: boolean): string {
  const categoryMapping: Record<string, string> = {
    Tree: 'Trees & Lumber',
    'Wood Logs': 'Trees & Lumber',
    Sapling: 'Trees & Lumber',
    Stick: 'Trees & Lumber',
    Stump: 'Trees & Lumber',
    Berry: 'Forage & Plants',
    Fruit: 'Forage & Plants',
    Flower: 'Forage & Plants',
    Mushroom: 'Forage & Plants',
    'Fiber Plant': 'Forage & Plants',
    'Wild Grain': 'Forage & Plants',
    'Wild Vegetable': 'Forage & Plants',
    Insects: 'Forage & Plants',
    Rock: 'Minerals & Stone',
    'Rock Boulder': 'Minerals & Stone',
    'Rock Outcrop': 'Minerals & Stone',
    Clay: 'Minerals & Stone',
    Sand: 'Minerals & Stone',
    Salt: 'Minerals & Stone',
    'Ore Vein': 'Minerals & Stone',
    'Metal Outcrop': 'Minerals & Stone',
    'Ocean Fish School': 'Aquatic Resources',
    'Lake Fish School': 'Aquatic Resources',
    'Chummed Ocean Fish School': 'Aquatic Resources',
    Baitfish: 'Aquatic Resources',
    Mollusks: 'Aquatic Resources',
    'Monster Den': 'Special Resources',
    'Wonder Resource': 'Special Resources',
    'Energy Font': 'Special Resources',
    Research: 'Special Resources',
    Note: 'Special Resources',
    Bones: 'Special Resources',
    Door: 'Interactive Objects',
    Obstacle: 'Interactive Objects',
    'Depleted Resource': 'Interactive Objects'
  }

  const category = categoryMapping[tag]
  if (category) return category

  // Fallback categorization based on properties
  if (flattenable) return 'Interactive Objects'
  return 'Other Resources'
}

/**
 * Check if resource is harvestable (has extraction recipe yield)
 */
function isHarvestable(resourceId: number, extractionRecipes: ExtractionRecipeDesc[]): boolean {
  // Check extraction recipes only
  const hasExtractionRecipe = extractionRecipes.some((recipe) => recipe.resourceId === resourceId)
  return hasExtractionRecipe
}

/**
 * Check if resource is naturally occurring (not planted/crafted)
 */
function isNaturallyOccurring(tag: ResourceTag): boolean {
  const naturalTags = [
    ResourceTag.Tree,
    ResourceTag.Berry,
    ResourceTag.Fruit,
    ResourceTag.Flower,
    ResourceTag.Mushroom,
    ResourceTag.FiberPlant,
    ResourceTag.WildGrain,
    ResourceTag.WildVegetable,
    ResourceTag.Rock,
    ResourceTag.RockBoulder,
    ResourceTag.RockOutcrop,
    ResourceTag.Clay,
    ResourceTag.Sand,
    ResourceTag.Salt,
    ResourceTag.OreVein,
    ResourceTag.MetalOutcrop,
    ResourceTag.OceanFishSchool,
    ResourceTag.LakeFishSchool,
    ResourceTag.Baitfish,
    ResourceTag.Mollusks,
    ResourceTag.Insects,
    ResourceTag.MonsterDen,
    ResourceTag.WonderResource,
    ResourceTag.EnergyFont,
    ResourceTag.Bones
  ]
  return naturalTags.includes(tag)
}

/**
 * Get yield description from extraction recipes only (for harvesting)
 */
function getYieldDescription(
  resourceId: number,
  extractionRecipes: ExtractionRecipeDesc[],
  itemLists: ItemListDesc[],
  itemDesc: ItemDesc[],
  cargoDesc: CargoDesc[]
): string {
  // Check extraction recipes for this resource
  const extractionYield = getYieldFromExtractionRecipes(resourceId, extractionRecipes, itemLists, itemDesc, cargoDesc)
  return extractionYield
}

/**
 * Get destroy yield description from onDestroyYield data (for player-placed resource refunds)
 */
function getDestroyYieldDescription(
  onDestroyYield: unknown[],
  onDestroyYieldResourceId: number,
  itemLists: ItemListDesc[],
  itemDesc: ItemDesc[],
  cargoDesc: CargoDesc[]
): string {
  // Check if we have yield data in the array format
  if (Array.isArray(onDestroyYield) && onDestroyYield.length > 0) {
    return getYieldFromArray(onDestroyYield, itemLists, itemDesc, cargoDesc)
  }

  // Check if we have a single resource ID yield
  if (onDestroyYieldResourceId && onDestroyYieldResourceId > 0) {
    return getYieldFromResourceId(onDestroyYieldResourceId, itemLists, itemDesc, cargoDesc)
  }

  return 'No destroy yield'
}

/**
 * Get yield description from onDestroyYield array format
 */
function getYieldFromArray(
  onDestroyYield: unknown[],
  itemLists: ItemListDesc[],
  itemDesc: ItemDesc[],
  cargoDesc: CargoDesc[]
): string {
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
    const item = itemDesc.find((item) => item.id === itemId)
    if (item) {
      itemName = item.name
    } else {
      const cargo = cargoDesc.find((cargo) => cargo.id === itemId)
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
  const yieldItems = Array.from(yieldMap.values()).map(({ name, totalQuantity }) => `${totalQuantity}x ${name}`)

  return yieldItems.join(', ')
}

/**
 * Get yield description from onDestroyYieldResourceId (single resource ID format)
 */
function getYieldFromResourceId(
  resourceId: number,
  itemLists: ItemListDesc[],
  itemDesc: ItemDesc[],
  cargoDesc: CargoDesc[]
): string {
  // Look up item name in items first, then cargo
  let itemName = null
  const item = itemDesc.find((item) => item.id === resourceId)
  if (item) {
    itemName = item.name
  } else {
    const cargo = cargoDesc.find((cargo) => cargo.id === resourceId)
    if (cargo) {
      itemName = cargo.name
    }
  }

  if (itemName) {
    // Assume quantity of 1 for single resource ID yields (this could be improved with more game data analysis)
    return `1x ${itemName}`
  } else {
    return `1x Unknown Item (ID: ${resourceId})`
  }
}

/**
 * Get yield description from extraction recipes
 */
function getYieldFromExtractionRecipes(
  resourceId: number,
  extractionRecipes: ExtractionRecipeDesc[],
  itemLists: ItemListDesc[],
  itemDesc: ItemDesc[],
  cargoDesc: CargoDesc[]
): string {
  // Find extraction recipes for this resource
  const resourceExtractionRecipes = extractionRecipes.filter((recipe) => recipe.resourceId === resourceId)

  if (resourceExtractionRecipes.length === 0) {
    return 'No yield'
  }

  const yieldItems: string[] = []

  for (const recipe of resourceExtractionRecipes) {
    if (Array.isArray(recipe.extractedItemStacks)) {
      for (const stackEntry of recipe.extractedItemStacks) {
        if (Array.isArray(stackEntry) && stackEntry.length >= 2) {
          const [stackData, probability] = stackEntry

          // Extract item ID and quantity from the stack data structure
          if (Array.isArray(stackData) && stackData.length >= 2) {
            const [, itemData] = stackData
            if (Array.isArray(itemData) && itemData.length >= 2) {
              const [itemId, quantity] = itemData

              if (typeof itemId === 'number' && typeof quantity === 'number') {
                // Resolve item (may be an item list container)
                const resolvedItems = resolveItemToActualItems(itemId, quantity, itemLists, itemDesc, cargoDesc)

                for (const resolvedItem of resolvedItems) {
                  // Combine extraction probability with item list probability
                  const combinedProb =
                    typeof probability === 'number' && typeof resolvedItem.probability === 'number'
                      ? probability * resolvedItem.probability
                      : probability || resolvedItem.probability

                  const probStr =
                    typeof combinedProb === 'number' && combinedProb < 1 ? ` (${(combinedProb * 100).toFixed(2)}%)` : ''
                  yieldItems.push(`${resolvedItem.quantity}x ${resolvedItem.name}${probStr}`)
                }
              }
            }
          }
        }
      }
    }
  }

  return yieldItems.length > 0 ? yieldItems.join(', ') : 'No yield'
}

/**
 * Resolve an item ID to actual items, checking if it's an item list container
 */
function resolveItemToActualItems(
  itemId: number,
  quantity: number,
  itemLists: ItemListDesc[],
  itemDesc: ItemDesc[],
  cargoDesc: CargoDesc[]
): { name: string; quantity: number; probability?: number }[] {
  // First check if this is a regular item (items have itemListId)
  const directItem = itemDesc.find((item) => item.id === itemId)
  if (directItem) {
    // Check for itemListId (handle camelCase conversion)
    const itemListId = (directItem as { itemListId?: number }).itemListId ?? 0

    // If it's a regular item and doesn't have an item_list_id, return it directly
    if (itemListId === 0) {
      return [{ name: directItem.name, quantity }]
    }

    // If it has an itemListId, resolve the item list
    if (itemListId > 0) {
      const itemList = itemLists.find((list) => list.id === itemListId)
      if (itemList && Array.isArray(itemList.possibilities)) {
        const resolvedItems: { name: string; quantity: number; probability?: number }[] = []

        for (const possibility of itemList.possibilities) {
          if (Array.isArray(possibility) && possibility.length >= 2) {
            const [probability, itemData] = possibility

            if (Array.isArray(itemData)) {
              for (const itemEntry of itemData) {
                if (Array.isArray(itemEntry) && itemEntry.length >= 2) {
                  const [nestedItemId, nestedQuantity] = itemEntry

                  if (typeof nestedItemId === 'number' && typeof nestedQuantity === 'number') {
                    // Look up the actual item name
                    let itemName = null
                    const nestedItem = itemDesc.find((item) => item.id === nestedItemId)
                    if (nestedItem) {
                      itemName = nestedItem.name
                    } else {
                      const nestedCargo = cargoDesc.find((cargo) => cargo.id === nestedItemId)
                      if (nestedCargo) {
                        itemName = nestedCargo.name
                      }
                    }

                    if (itemName) {
                      resolvedItems.push({
                        name: itemName,
                        quantity: quantity * nestedQuantity,
                        probability: typeof probability === 'number' ? probability : undefined
                      })
                    } else {
                      resolvedItems.push({
                        name: `Unknown Item (ID: ${nestedItemId})`,
                        quantity: quantity * nestedQuantity,
                        probability: typeof probability === 'number' ? probability : undefined
                      })
                    }
                  }
                }
              }
            }
          }
        }

        return resolvedItems
      }
    }
  }

  // Check if it's cargo (fallback)
  const directCargo = cargoDesc.find((cargo) => cargo.id === itemId)
  if (directCargo) {
    return [{ name: directCargo.name, quantity }]
  }

  // Fallback: return as unknown item
  return [{ name: `Unknown Item (ID: ${itemId})`, quantity }]
}

/**
 * Get biome information for a resource by cross-referencing placement recipes and community data
 */
async function getResourceBiomes(
  resourceId: number,
  resourceTag: string,
  resourceTier: number,
  resourcePlacementRecipes: ResourcePlacementRecipeDesc[],
  biomeDescs: BiomeDesc[],
  communityData?: Record<string, Record<string, string[]>>
): Promise<{ availableBiomes: string[]; biomeDetails: BiomeWithInfo[]; primaryBiome: string }> {
  // Find placement recipes that reference this resource
  const placementRecipes = resourcePlacementRecipes.filter((recipe) => recipe.resourceDescriptionId === resourceId)

  // Extract unique biome types from all placement recipes
  const biomeTypes = new Set<number>()
  placementRecipes.forEach((recipe) => {
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

  biomeTypes.forEach((biomeType) => {
    const biomeDesc = biomeDescs.find((desc) => desc.biomeType === biomeType)
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

  // If no biomes found from placement recipes, try community data for natural resources
  if (availableBiomes.length === 0 && communityData) {
    const communityBiomes = getCommunityBiomesForTag(resourceTag, resourceTier, communityData)

    // Optional debug for biome matching
    // console.log(`${resourceTag} T${resourceTier} - Community biomes found: ${communityBiomes}`)

    // Map community biome names to our biome descriptions
    communityBiomes.forEach((biomeName) => {
      // Normalize the community biome name to match database conventions
      const normalizedBiomeName = normalizeBiomeName(biomeName)

      const biomeDesc = biomeDescs.find(
        (desc) =>
          desc.name === normalizedBiomeName ||
          desc.name.toLowerCase().includes(biomeName.toLowerCase()) ||
          biomeName.toLowerCase().includes(desc.name.toLowerCase())
      )

      // Optional debug for biome name matching
      // console.log(`Matching community biome "${biomeName}" (normalized: "${normalizedBiomeName}") -> game biome: ${biomeDesc?.name || 'NOT FOUND'}`)
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
  }

  // Determine primary biome (first one, or most common)
  const primaryBiome = availableBiomes.length > 0 ? availableBiomes[0] : 'Unknown'

  return { availableBiomes, biomeDetails, primaryBiome }
}

/**
 * Get all resource items from static data
 */
export async function getResourceItems(): Promise<ResourceDesc[]> {
  const { resourceDesc } = getResourceData()
  return resourceDesc.filter((resource) => resource.compendiumEntry)
}

/**
 * Get resources with computed properties, biome data, and enriched information
 */
export async function getResourcesWithStats(): Promise<ResourceWithStats[]> {
  const {
    resourceDesc,
    biomeDesc,
    resourcePlacementRecipeDesc,
    extractionRecipeDesc,
    itemListDesc,
    itemDesc,
    cargoDesc
  } = getResourceData()
  const results: ResourceWithStats[] = []

  // Fetch community biome data
  const communityData = await fetchCommunityBiomeData()

  const compendiumResources = resourceDesc.filter((resource) => resource.compendiumEntry)

  for (const resource of compendiumResources) {
    // Calculate computed properties
    const resourceCategory = getResourceCategory(resource.tag, resource.flattenable)
    const isHarvestableResource = isHarvestable(resource.id, extractionRecipeDesc)
    const isNaturallyOccurringResource = isNaturallyOccurring(resource.tag as ResourceTag)
    const isRespawning = !resource.notRespawning
    const isFlattenable = resource.flattenable
    const yieldDescription = getYieldDescription(resource.id, extractionRecipeDesc, itemListDesc, itemDesc, cargoDesc)
    const destroyYieldDescription = getDestroyYieldDescription(
      resource.onDestroyYield,
      resource.onDestroyYieldResourceId,
      itemListDesc,
      itemDesc,
      cargoDesc
    )

    // Get biome information
    const { availableBiomes, biomeDetails, primaryBiome } = await getResourceBiomes(
      resource.id,
      resource.tag,
      resource.tier,
      resourcePlacementRecipeDesc,
      biomeDesc,
      communityData
    )

    results.push({
      ...resource,
      resourceCategory,
      isHarvestable: isHarvestableResource,
      isNaturallyOccurring: isNaturallyOccurringResource,
      isRespawning,
      isFlattenable,
      availableBiomes,
      biomeDetails,
      primaryBiome,
      yieldDescription,
      destroyYieldDescription
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
    resource.availableBiomes.forEach((biome) => {
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
    categoryDistribution[resource.resourceCategory] = (categoryDistribution[resource.resourceCategory] || 0) + 1
  })

  // Calculate type counts
  const harvestableCount = resources.filter((r) => r.isHarvestable).length
  const naturalCount = resources.filter((r) => r.isNaturallyOccurring).length
  const respawningCount = resources.filter((r) => r.isRespawning).length
  const flattenableCount = resources.filter((r) => r.isFlattenable).length

  // Calculate health statistics
  const healthValues = resources.map((r) => r.maxHealth).filter((h) => h > 0)
  const healthStats =
    healthValues.length > 0
      ? {
          minHealth: Math.min(...healthValues),
          maxHealth: Math.max(...healthValues),
          avgHealth: Math.round(healthValues.reduce((sum, h) => sum + h, 0) / healthValues.length)
        }
      : {
          minHealth: 0,
          maxHealth: 0,
          avgHealth: 0
        }

  // Calculate biome coverage statistics
  const biomeCoverage: Record<string, number> = {}
  resources.forEach((resource) => {
    resource.availableBiomes.forEach((biome) => {
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
    healthStats,
    biomeCoverage,
    resourcesByTag: Object.entries(resourcesByTag).map(([tag, resourceList]) => ({
      tag,
      count: resourceList.length,
      category: resourceList[0]?.resourceCategory || 'Unknown',
      primaryBiome: resourceList[0]?.primaryBiome || 'Unknown',
      avgHealth:
        resourceList.length > 0
          ? Math.round(resourceList.reduce((sum, r) => sum + r.maxHealth, 0) / resourceList.length)
          : 0
    })),
    resourcesByCategory: Object.entries(resourcesByCategory).map(([category, resourceList]) => ({
      category,
      count: resourceList.length,
      avgTier:
        resourceList.length > 0
          ? Math.round(resourceList.reduce((sum, r) => sum + r.tier, 0) / resourceList.length)
          : 0,
      harvestableCount: resourceList.filter((r) => r.isHarvestable).length
    })),
    resourcesByBiome: Object.entries(resourcesByBiome).map(([biome, resourceList]) => ({
      biome,
      count: resourceList.length,
      categoryCount: new Set(resourceList.map((r) => r.resourceCategory)).size
    }))
  }
}

