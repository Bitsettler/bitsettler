import { getResourceStatistics, getResourceTagsMetadata } from '@/lib/spacetime-db-new/modules/resources/flows'
import { ResourceIndexPageView } from '@/views/resource-views/resource-index-page-view'

export default async function ResourcesPage() {
  // Get resource metadata (includes count for each tag)
  const resourceCategories = getResourceTagsMetadata()
    .filter((category) => category.count > 0) // Only show categories with items
    .map((meta) => ({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      icon: meta.icon,
      tag: meta.name, // The actual tag name
      category: meta.section,
      href: meta.href,
      count: meta.count,
      primaryBiomes: [], // No biome data in SDK
      resourceCategory: meta.category
    }))

  // Get live resource statistics
  const resourceStats = getResourceStatistics()
  const totalResources = resourceStats.total

  return (
    <ResourceIndexPageView
      title="Resources"
      subtitle={`${totalResources} resources across ${resourceCategories.length} categories`}
      resourceCategories={resourceCategories}
    />
  )
}
