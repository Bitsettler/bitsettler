import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import type { CompendiumEntity } from './types'

/**
 * Filter entities to only include resources
 */
export function filterToResources(entities: CompendiumEntity[]): ResourceDesc[] {
  return entities.filter((entity) => entity.entityType === 'resource').map((entity) => entity as ResourceDesc)
}

/**
 * Filter resources by ore veins
 */
export function filterOreVeins(resources: ResourceDesc[]): ResourceDesc[] {
  return resources.filter((resource) => resource.tag === 'Ore Vein')
}

/**
 * Filter resources by trees
 */
export function filterTrees(resources: ResourceDesc[]): ResourceDesc[] {
  return resources.filter((resource) => resource.tag === 'Tree')
}

/**
 * Filter resources by plants/flowers
 */
export function filterPlants(resources: ResourceDesc[]): ResourceDesc[] {
  const plantTags = ['Flower', 'Plant', 'Herb', 'Bush', 'Vine']
  return resources.filter((resource) => plantTags.includes(resource.tag))
}

/**
 * Filter resources by harvestable type
 */
export function filterHarvestables(resources: ResourceDesc[]): ResourceDesc[] {
  const harvestableTags = ['Flower', 'Plant', 'Herb', 'Bush', 'Vine', 'Tree']
  return resources.filter((resource) => harvestableTags.includes(resource.tag))
}

/**
 * Filter resources by mineable type
 */
export function filterMineables(resources: ResourceDesc[]): ResourceDesc[] {
  const mineableTags = ['Ore Vein', 'Rock', 'Stone']
  return resources.filter((resource) => mineableTags.includes(resource.tag))
}

/**
 * Get resource statistics by category
 */
export function getResourceStatsByCategory(resources: ResourceDesc[]): Record<string, number> {
  const stats: Record<string, number> = {}

  resources.forEach((resource) => {
    const category = resource.tag || 'Uncategorized'
    stats[category] = (stats[category] || 0) + 1
  })

  return stats
}

/**
 * Check if resource is renewable
 */
export function isRenewable(resource: ResourceDesc): boolean {
  // Trees, plants, and flowers are typically renewable
  const renewableTags = ['Tree', 'Flower', 'Plant', 'Herb', 'Bush', 'Vine']
  return renewableTags.includes(resource.tag)
}

/**
 * Get tier distribution for resources
 */
export function getResourceTierDistribution(resources: ResourceDesc[]): Record<number, number> {
  const distribution: Record<number, number> = {}

  resources.forEach((resource) => {
    distribution[resource.tier] = (distribution[resource.tier] || 0) + 1
  })

  return distribution
}

/**
 * Get resource yield information (placeholder)
 */
export function getResourceYield(resource: ResourceDesc): string {
  // This would need to be implemented with actual yield data
  // For now, return placeholder based on type
  if (resource.tag === 'Ore Vein') {
    return 'Ore chunks and gems'
  } else if (resource.tag === 'Tree') {
    return 'Wood and sometimes fruits'
  } else if (['Flower', 'Plant', 'Herb'].includes(resource.tag)) {
    return 'Fibers, herbs, and reagents'
  }
  return 'Unknown yield'
}

/**
 * Get harvesting skill required for resource
 */
export function getHarvestingSkill(resource: ResourceDesc): string {
  if (resource.tag === 'Ore Vein') {
    return 'Mining'
  } else if (resource.tag === 'Tree') {
    return 'Forestry'
  } else if (['Flower', 'Plant', 'Herb', 'Bush', 'Vine'].includes(resource.tag)) {
    return 'Foraging'
  }
  return 'Unknown'
}
