import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import resourceDescData from '@/data/sdk-tables/resource_desc.json'

// SDK data is already in camelCase format, no transformation needed
const resources = resourceDescData as ResourceDesc[]

/**
 * Get all resources from SDK data
 */
export function getAllResources(): ResourceDesc[] {
  return resources
}
