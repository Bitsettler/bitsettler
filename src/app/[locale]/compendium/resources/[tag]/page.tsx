import { getAllResourceTags, getResourcesByTags } from '@/lib/spacetime-db-new/modules/resources/commands'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
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

  // Convert slug back to tag name  
  const tagName = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Check if this tag is valid
  const allTags = getAllResourceTags()
  if (!allTags.includes(tagName)) {
    notFound()
  }

  // Get resources for this tag using SDK data
  const resources = getResourcesByTags([tagName])

  // If no resources found for this tag, return 404
  if (resources.length === 0) {
    notFound()
  }

  // Note: Could use getResourceTagsMetadata() for additional navigation info if needed

  return (
    <ResourceIndividualTagPageView
      tagName={tagName}
      resources={resources}
      backLink="/compendium/resources"
      backLinkText="← Back to Resources"
    />
  )
}
