import {
  getResourcesGroupedByBiome,
  getResourcesGroupedByCategory,
  getResourcesGroupedByTag
} from './get-resources-grouped'
import { getResourcesWithStats } from './get-resources-with-stats'

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
