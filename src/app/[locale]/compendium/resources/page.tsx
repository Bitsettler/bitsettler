import { resourceCollections } from '@/lib/spacetime-db/resources/resource-tag-collections'
import { getResourceStatistics, getResourcesGroupedByTag } from '@/lib/spacetime-db/resources/resources'
import { ResourceIndexPageView } from '@/views/resource-views/resource-index-page-view'

export default async function ResourcesPage() {
  // Get resource categories from centralized metadata
  const resourceCollection = resourceCollections.resources

  // Get actual resource counts by tag
  const resourcesByTag = await getResourcesGroupedByTag()

  const resourceCategories = resourceCollection.tags
    .map((tag) => {
      const categoryMeta = resourceCollection.categories[tag]
      const resourceItems = resourcesByTag[tag] || []

      return {
        id: categoryMeta.id,
        name: categoryMeta.name,
        description: categoryMeta.description,
        icon: categoryMeta.icon,
        tag,
        category: categoryMeta.section,
        href: categoryMeta.href,
        count: resourceItems.length,
        primaryBiomes: categoryMeta.primaryBiomes,
        resourceCategory: categoryMeta.category
      }
    })
    .filter((category) => category.count > 0) // Only show categories with items

  // Get live resource statistics
  const resourceStats = await getResourceStatistics()
  const totalResources = resourceStats.total

  return (
    <ResourceIndexPageView
      title="Resources"
      subtitle={`${totalResources} resources across ${resourceCategories.length} categories with biome location data`}
      resourceCategories={resourceCategories}
    />
  )
}
