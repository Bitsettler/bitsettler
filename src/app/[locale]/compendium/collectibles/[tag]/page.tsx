import { getCollectiblesByTypeSlugs } from '@/lib/spacetime-db-new/modules/collectibles/commands'
import { getAllCollectibleTypes } from '@/lib/spacetime-db-new/modules/collectibles/commands/get-all-collectible-types'
import { getCollectiblesForCompendium } from '@/lib/spacetime-db-new/modules/collectibles/flows'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { CollectiblesIndividualTagPageView } from '@/views/collectibles-views/collectibles-individual-tag-page-view'
import { notFound } from 'next/navigation'

// Generate static params for all collectible types
export function generateStaticParams() {
  const collectibleTypes = getAllCollectibleTypes()

  return collectibleTypes.map((type) => ({
    tag: createSlug(type)
  }))
}

interface PageProps {
  params: Promise<{
    tag: string
  }>
}

export default async function CollectibleTagPage({ params }: PageProps) {
  const { tag } = await params

  // Get collectibles by type slug
  const collectibles = getCollectiblesByTypeSlugs([tag])

  // Filter for compendium entries by getting the ones with valid deeds
  const collectiblesForCompendium = getCollectiblesForCompendium()
  const filteredCollectibles = collectiblesForCompendium.filter((item) =>
    collectibles.some((collectible) => collectible.id === item.collectible.id)
  )

  // If no collectibles found, return 404
  if (filteredCollectibles.length === 0) {
    notFound()
  }

  // Get the collectible type name from the first collectible
  const collectibleTypeName =
    filteredCollectibles[0].collectible.collectibleType.tag

  return (
    <CollectiblesIndividualTagPageView
      tagName={collectibleTypeName}
      collectibles={filteredCollectibles}
      backLink="/compendium/collectibles"
      backLinkText="← Back to Collectibles"
    />
  )
}
