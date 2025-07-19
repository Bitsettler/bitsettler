import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import resourceDescData from '@/data/global/resource_desc.json'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'

// Convert snake_case JSON to camelCase and type properly
const resources = camelCaseDeep<ResourceDesc[]>(resourceDescData)

/**
 * Get all resources
 */
export function getAllResources(): ResourceDesc[] {
  return resources
}