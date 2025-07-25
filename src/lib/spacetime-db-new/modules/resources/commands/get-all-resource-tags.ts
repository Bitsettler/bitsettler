import { getAllResources } from './get-all-resources'

/**
 * Get all unique resource tags from SDK data
 * This replaces the hardcoded enum/array in resource-tag-collections
 */
export function getAllResourceTags(): string[] {
  const resources = getAllResources()
  const tags = new Set<string>()

  resources.forEach((resource) => {
    if (resource.tag && resource.compendiumEntry) {
      tags.add(resource.tag)
    }
  })

  return Array.from(tags).sort()
}
