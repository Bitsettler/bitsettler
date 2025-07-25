import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getAllResources } from './get-all-resources'

/**
 * Get resources by slug (handles special characters properly)
 */
export function getResourcesBySlug(slug: string): ResourceDesc[] {
  const allResources = getAllResources()
  return allResources.filter((resource) => resource.tag && createSlug(resource.tag) === slug && resource.compendiumEntry)
}