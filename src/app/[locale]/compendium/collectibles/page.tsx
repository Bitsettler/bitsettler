import { getCollectibleStatistics } from '@/lib/spacetime-db-live/collectibles'
import { ItemTag } from '@/lib/spacetime-db/items/tags'
import { getItemsByTags } from '@/lib/spacetime-db/items/utils'
import { CollectiblesView } from '@/views/collectibles-views/collectibles-index-page-view'

export default async function CollectiblesPage() {
  // Define collectible categories based on tags
  const collectibleCategories = [
    // Property Deeds
    {
      id: 'deed',
      name: 'Property Deeds',
      description: 'Legal documents for claiming and owning cosmetic items, pets, and other stationary structures',
      icon: '📜',
      tag: ItemTag.Deed,
      category: 'Property & Ownership',
      href: '/compendium/deed'
    },
    // Deployable Deeds
    {
      id: 'deployable-deed',
      name: 'Deployable Deeds',
      description: 'Deeds for portable structures and deployable items like vehicles and mounts',
      icon: '🏗️',
      tag: ItemTag.DeployableDeed,
      category: 'Property & Ownership',
      href: '/compendium/deployable-deed'
    }
  ]

  // Get item counts for each category
  const categoriesWithCounts = collectibleCategories.map((category) => {
    const items = getItemsByTags([category.tag])
    return {
      ...category,
      count: items.length
    }
  })

  // Get live collectible statistics
  const collectibleStats = await getCollectibleStatistics()
  const totalCollectibles = collectibleStats.total

  return (
    <CollectiblesView
      title="Collectibles"
      subtitle={`${totalCollectibles} collectible items across ${categoriesWithCounts.length} categories`}
      collectibleCategories={categoriesWithCounts}
    />
  )
}
