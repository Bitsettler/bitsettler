import { getConsumableStatistics, getConsumableTagsMetadata } from '@/lib/spacetime-db-new/modules/items/flows'
import { ConsumablesView } from '@/views/consumables-views/consumables-index-page-view'

export default async function ConsumablesPage() {
  // Get consumable metadata (includes count for each tag)
  const consumableCategories = getConsumableTagsMetadata()
    .filter((category) => category.count > 0) // Only show categories with items
    .map((meta) => ({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      icon: meta.icon,
      tag: meta.name, // The actual tag name
      category: meta.section,
      href: meta.href,
      count: meta.count
    }))

  // Get live consumable statistics
  const consumableStats = getConsumableStatistics()
  const totalConsumables = consumableStats.total

  return (
    <ConsumablesView
      title="Consumables"
      subtitle={`${totalConsumables} consumable items across ${consumableCategories.length} categories`}
      consumableCategories={consumableCategories}
    />
  )
}
