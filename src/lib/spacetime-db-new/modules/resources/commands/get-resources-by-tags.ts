import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { getAllResources } from './get-all-resources'

/**
 * Get resources filtered by one or more tags
 */
export function getResourcesByTags(tags: string[]): ResourceDesc[] {
  const allResources = getAllResources()
  return allResources.filter(
    (resource) =>
      resource.tag && tags.includes(resource.tag) && resource.compendiumEntry
  )
}
