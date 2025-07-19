import { getItemsByTags } from '@/lib/spacetime-db/modules/items/commands'
import { tagCollections } from '@/lib/spacetime-db/modules/collections/item-tag-collections'
import { getConsumableStatistics } from '@/lib/spacetime-db/modules/collections/consumables'
import { ConsumablesView } from '@/views/consumables-views/consumables-index-page-view'

export default async function ConsumablesPage() {
  // Get consumable categories from centralized metadata
  const consumableCollection = tagCollections.consumables
  const consumableCategories = consumableCollection.tags.map((tag) => {
    const categoryMeta = consumableCollection.categories[tag]
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

  // Get item counts for each category using getItemsByTags for consistency
  const categoriesWithCounts = consumableCategories.map((category) => {
    const items = getItemsByTags([category.tag])
    return {
      ...category,
      count: items.length
    }
  })

  // Get live consumable statistics
  const consumableStats = await getConsumableStatistics()
  const totalConsumables = consumableStats.total

  return (
    <ConsumablesView
      title="Consumables"
      subtitle={`${totalConsumables} consumable items across ${categoriesWithCounts.length} categories`}
      consumableCategories={categoriesWithCounts}
    />
  )
}
