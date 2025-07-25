import { getAllCargoTags, getCargoBySlug } from '@/lib/spacetime-db-new/modules/cargo/commands'
import { createSlug, slugToTitleCase } from '@/lib/spacetime-db-new/shared/utils/entities'
import { CargoIndividualTagPageView } from '@/views/cargo-views/cargo-individual-tag-page-view'
import { notFound } from 'next/navigation'

// Generate static params for all possible cargo tag combinations
export function generateStaticParams() {
  const allTags = getAllCargoTags()
  return allTags.map((tag) => ({
    tag: createSlug(tag)
  }))
}

interface PageProps {
  params: Promise<{
    tag: string
  }>
}

export default async function CargoTagPage({ params }: PageProps) {
  const { tag } = await params

  // Get cargo for this specific tag using slug (handles special characters properly)
  const cargo = getCargoBySlug(tag)

  // If no cargo found for this tag, return 404
  if (cargo.length === 0) {
    notFound()
  }

  // Find the actual tag name for display
  const allTags = getAllCargoTags()
  const actualTag = allTags.find(tagName => createSlug(tagName) === tag)
  const displayName = actualTag || slugToTitleCase(tag)

  // If no cargo found for this tag, return 404
  if (cargo.length === 0) {
    notFound()
  }

  return (
    <CargoIndividualTagPageView
      tagName={displayName}
      cargo={cargo}
      backLink="/compendium/cargo"
      backLinkText="← Back to Cargo"
    />
  )
}
