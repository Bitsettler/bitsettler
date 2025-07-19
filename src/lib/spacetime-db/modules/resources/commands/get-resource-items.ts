import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { getAllResources } from './get-all-resources'

/**
 * Get all resource items from static data
 */
export function getResourceItems(): ResourceDesc[] {
  const resources = getAllResources()
  return resources.filter((resource) => resource.compendiumEntry)
}
