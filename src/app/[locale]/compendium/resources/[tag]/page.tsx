import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import resourceDescData from '@/data/global/resource_desc.json'
import { findResourceTagCollection, resourceCollections } from '@/lib/spacetime-db/resources/resource-tag-collections'
import { getResourcesWithStats } from '@/lib/spacetime-db/resources/resources'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import { ResourceIndividualTagPageView } from '@/views/resource-views/resource-individual-tag-page-view'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    tag: string
  }>
}

export default async function ResourceTagPage({ params }: PageProps) {
  const { tag } = await params

  // Convert slug back to tag name
  const tagName = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Convert snake_case JSON to camelCase and type properly
  const resourceData = camelCaseDeep<ResourceDesc[]>(resourceDescData)

  // Filter resource entries by tag
  const resources = resourceData.filter((resource) => resource.tag === tagName)

  // If no resources found for this tag, return 404
  if (resources.length === 0) {
    notFound()
  }

  // Check if this tag is actually a valid resource tag
  const isValidResourceTag = resourceCollections.resources.tags.some((tag) => tag === tagName)

  if (!isValidResourceTag) {
    notFound()
  }

  // Find the resource collection for navigation
  const parentResourceCollection = findResourceTagCollection(tagName)

  // Handle resource tags with the specialized component
  try {
    const resourcesWithStats = await getResourcesWithStats()
    const resourcesForThisTag = resourcesWithStats.filter((resourceItem) => resourceItem.tag === tagName)

    return (
      <ResourceIndividualTagPageView
        tagName={tagName}
        resources={resourcesForThisTag}
        backLink={parentResourceCollection?.href || '/compendium/resources'}
        backLinkText={parentResourceCollection ? `← Back to ${parentResourceCollection.name}` : '← Back to Resources'}
      />
    )
  } catch (error) {
    console.warn('Failed to fetch live resource data during build, using static fallback:', error)
    return (
      <ResourceIndividualTagPageView
        tagName={tagName}
        resources={[]}
        backLink={parentResourceCollection?.href || '/compendium/resources'}
        backLinkText={parentResourceCollection ? `← Back to ${parentResourceCollection.name}` : '← Back to Resources'}
      />
    )
  }
}
