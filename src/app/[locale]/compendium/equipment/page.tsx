import { getItemsByTags, tagCollections } from '@/lib/spacetime-db'
import { getEquipmentStatistics } from '@/lib/spacetime-db/equipments'
import { EquipmentView } from '@/views/equipment-views/equipment-index-page-view'

export default async function EquipmentPage() {
  // Get equipment categories from centralized metadata
  const equipmentCollection = tagCollections.equipment
  const equipmentCategories = equipmentCollection.tags.map((tag) => {
    const categoryMeta = equipmentCollection.categories[tag]
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
  const categoriesWithCounts = equipmentCategories.map((category) => {
    const items = getItemsByTags([category.tag])
    return {
      ...category,
      count: items.length
    }
  })

  // Get live equipment statistics
  const equipmentStats = await getEquipmentStatistics()
  const totalEquipment = equipmentStats.total

  return (
    <EquipmentView
      title="Equipment"
      subtitle={`${totalEquipment} equipment items across ${categoriesWithCounts.length} categories`}
      equipmentCategories={categoriesWithCounts}
    />
  )
}
