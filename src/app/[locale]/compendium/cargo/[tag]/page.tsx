import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import cargoDescData from '@/data/global/cargo_desc.json'
import { getCargoWithStats } from '@/lib/spacetime-db-live/cargo'
import { cargoCollections, findCargoTagCollection } from '@/lib/spacetime-db-live/cargo-tag-collections'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import { CargoIndividualTagPageView } from '@/views/cargo-views/cargo-individual-tag-page-view'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    tag: string
  }>
}

export default async function CargoTagPage({ params }: PageProps) {
  const { tag } = await params

  // Convert slug back to tag name
  const tagName = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Convert snake_case JSON to camelCase and type properly
  const cargoData = camelCaseDeep<CargoDesc[]>(cargoDescData)

  // Filter cargo entries by tag
  const cargo = cargoData.filter((cargo) => cargo.tag === tagName)

  // If no cargo found for this tag, return 404
  if (cargo.length === 0) {
    notFound()
  }

  // Check if this tag is actually a valid cargo tag
  const isValidCargoTag = cargoCollections.cargo.tags.some((tag) => tag === tagName)
  
  if (!isValidCargoTag) {
    notFound()
  }

  // Find the cargo collection for navigation
  const parentCargoCollection = findCargoTagCollection(tagName)

  // Handle cargo tags with the specialized component
  try {
    const cargoWithStats = await getCargoWithStats()
    const cargoForThisTag = cargoWithStats.filter((cargoItem) => cargoItem.tag === tagName)

    return (
      <CargoIndividualTagPageView
        tagName={tagName}
        cargo={cargoForThisTag}
        backLink={parentCargoCollection?.href || '/compendium/cargo'}
        backLinkText={parentCargoCollection ? `← Back to ${parentCargoCollection.name}` : '← Back to Cargo'}
      />
    )
  } catch (error) {
    console.warn('Failed to fetch live cargo data during build, using static fallback:', error)
    return (
      <CargoIndividualTagPageView
        tagName={tagName}
        cargo={[]}
        backLink={parentCargoCollection?.href || '/compendium/cargo'}
        backLinkText={parentCargoCollection ? `← Back to ${parentCargoCollection.name}` : '← Back to Cargo'}
      />
    )
  }
}