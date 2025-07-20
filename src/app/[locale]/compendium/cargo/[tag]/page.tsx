import { getAllCargoTags } from '@/lib/spacetime-db-new/modules/cargo/commands/get-all-cargo-tags'
import { getCargoByTags } from '@/lib/spacetime-db-new/modules/cargo/commands/get-cargo-by-tags'
import { CargoIndividualTagPageView } from '@/views/cargo-views/cargo-individual-tag-page-view'
import { notFound } from 'next/navigation'

// Generate static params for all possible cargo tag combinations
export function generateStaticParams() {
  const allTags = getAllCargoTags()
  return allTags.map((tag) => ({ 
    tag: tag.toLowerCase().replace(/\s+/g, '-') 
  }))
}

interface PageProps {
  params: Promise<{
    tag: string
  }>
}

export default async function CargoTagPage({ params }: PageProps) {
  const { tag } = await params

  // Convert slug back to tag name
  const tagName = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Validate tag exists
  const allTags = getAllCargoTags()
  if (!allTags.includes(tagName)) {
    notFound()
  }

  // Get cargo for this specific tag using SDK data
  const cargo = getCargoByTags([tagName])

  // If no cargo found for this tag, return 404
  if (cargo.length === 0) {
    notFound()
  }

  return (
    <CargoIndividualTagPageView
      tagName={tagName}
      cargo={cargo}
      backLink="/compendium/cargo"
      backLinkText="← Back to Cargo"
    />
  )
}
