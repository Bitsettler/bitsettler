import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { getAllResources } from './get-all-resources'

/**
 * Get all resources that are marked for compendium entry
 */
export function getResourcesInCompendium(): ResourceDesc[] {
  const resources = getAllResources()
  return resources.filter((resource) => resource.compendiumEntry)
}