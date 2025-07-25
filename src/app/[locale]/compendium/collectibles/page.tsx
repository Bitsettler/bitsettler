import {
  getCollectibleStatistics,
  getCollectiblesGroupedByType
} from '@/lib/spacetime-db-new/modules/collectibles/flows'
import { CollectiblesView } from '@/views/collectibles-views/collectibles-index-page-view'

export default function CollectiblesPage() {
  // Get collectible groups with actual data
  const collectibleGroups = getCollectiblesGroupedByType()

  // Create categories from actual collectible data pointing to tag routes
  const collectibleCategories = collectibleGroups.map((group) => ({
    id: group.slug,
    name: group.name,
    description: `${group.count} ${group.name.toLowerCase()} collectibles`,
    icon: group.iconAssetName,
    tag: group.name,
    category: 'Collectibles',
    href: `/compendium/collectibles/${group.slug.toLowerCase()}`,
    count: group.count
  }))

  // Get live collectible statistics
  const collectibleStats = getCollectibleStatistics()
  const totalCollectibles = collectibleStats.total

  return (
    <CollectiblesView
      title="Collectibles"
      subtitle={`${totalCollectibles} collectible items across ${collectibleStats.types} types`}
      collectibleCategories={collectibleCategories}
    />
  )
}
