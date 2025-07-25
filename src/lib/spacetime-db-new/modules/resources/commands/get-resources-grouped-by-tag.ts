import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { getAllResources } from './get-all-resources'

/**
 * Get all resources grouped by their tag
 */
export function getResourcesGroupedByTag(): Record<string, ResourceDesc[]> {
  const resources = getAllResources().filter((resource) => resource.compendiumEntry)

  return resources.reduce(
    (groups, resource) => {
      if (resource.tag) {
        if (!groups[resource.tag]) {
          groups[resource.tag] = []
        }
        groups[resource.tag].push(resource)
      }
      return groups
    },
    {} as Record<string, ResourceDesc[]>
  )
}
