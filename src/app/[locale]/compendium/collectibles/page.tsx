import { ItemTag } from '@/lib/spacetime-db/items/tags'
import { getItemsByTags } from '@/lib/spacetime-db/items/utils'
import { CollectiblesView } from '@/views/collectibles-views/collectibles-index-page-view'

export default function CollectiblesPage() {
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
    },
    // Writs & Documents
    {
      id: 'writ',
      name: 'Writs & Documents',
      description: 'Official documents, permits, and administrative papers',
      icon: '📋',
      tag: ItemTag.Writ,
      category: 'Documents & Permits',
      href: '/compendium/writ'
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

  // Calculate total collectibles using the defined tags
  const collectibleTags = [ItemTag.Deed, ItemTag.DeployableDeed, ItemTag.Writ]
  const totalCollectibles = collectibleTags.reduce((total, tag) => {
    return total + getItemsByTags([tag]).length
  }, 0)

  return (
    <CollectiblesView
      title="Collectibles"
      subtitle={`${totalCollectibles} collectible items across ${categoriesWithCounts.length} categories`}
      collectibleCategories={categoriesWithCounts}
    />
  )
}

