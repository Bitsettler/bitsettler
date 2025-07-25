import { getAllResourceTags, getResourcesBySlug } from '@/lib/spacetime-db-new/modules/resources/commands'
import { createSlug, slugToTitleCase } from '@/lib/spacetime-db-new/shared/utils/entities'
import { ResourceIndividualTagPageView } from '@/views/resource-views/resource-individual-tag-page-view'
import { notFound } from 'next/navigation'

// Generate static params for all possible resource tag combinations
export function generateStaticParams() {
  const allTags = getAllResourceTags()
  return allTags.map((tag) => ({ tag: createSlug(tag) }))
}

interface PageProps {
  params: Promise<{
    tag: string
  }>
}

export default async function ResourceTagPage({ params }: PageProps) {
  const { tag } = await params

  // Get resources for this tag using slug (handles special characters properly)
  const resources = getResourcesBySlug(tag)

  // If no resources found for this tag, return 404
  if (resources.length === 0) {
    notFound()
  }

  // Find the actual tag name for display
  const allTags = getAllResourceTags()
  const actualTag = allTags.find((tagName) => createSlug(tagName) === tag)
  const displayName = actualTag || slugToTitleCase(tag)

  // If no resources found for this tag, return 404
  if (resources.length === 0) {
    notFound()
  }

  // Note: Could use getResourceTagsMetadata() for additional navigation info if needed

  return (
    <ResourceIndividualTagPageView
      tagName={displayName}
      resources={resources}
      backLink="/compendium/resources"
      backLinkText="← Back to Resources"
    />
  )
}
