import { getCollectibleStatistics } from '@/lib/spacetime-db/modules/collectibles/collectibles'
import { tagCollections } from '@/lib/spacetime-db/modules/collections/item-tag-collections'
import { getItemsByTags } from '@/lib/spacetime-db/modules/items/commands'
import { CollectiblesView } from '@/views/collectibles-views/collectibles-index-page-view'

export default async function CollectiblesPage() {
  // Get collectible categories from centralized metadata
  const collectibleCollection = tagCollections.collectibles
  const collectibleCategories = collectibleCollection.tags.map((tag) => {
    const categoryMeta = collectibleCollection.categories[tag]
    return {
      id: categoryMeta.id,
      name: categoryMeta.name,
      description: categoryMeta.description,
      icon: categoryMeta.icon,
      tag,
      category: categoryMeta.section,
      href: categoryMeta.href
    }
  })

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
