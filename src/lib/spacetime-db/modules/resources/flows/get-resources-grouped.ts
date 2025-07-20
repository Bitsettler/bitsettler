import { getResourcesWithStats, type ResourceWithStats } from './get-resources-with-stats'

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
