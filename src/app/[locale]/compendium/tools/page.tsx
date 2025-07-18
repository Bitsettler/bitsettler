import { getItemsByTags } from '@/lib/spacetime-db'
import { getToolStatistics } from '@/lib/spacetime-db/modules/collections/tools'
import { tagCollections } from '@/lib/spacetime-db/modules/collections/item-tag-collections'
import { ToolsView } from '@/views/tools-views/tools-index-page-view'

export default async function ToolsPage() {
  // Get tool categories from centralized metadata
  const toolCollection = tagCollections.tools
  const toolCategories = toolCollection.tags.map((tag) => {
    const categoryMeta = toolCollection.categories[tag]
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
  const categoriesWithCounts = toolCategories.map((category) => {
    const items = getItemsByTags([category.tag])
    return {
      ...category,
      count: items.length
    }
  })

  // Get live tool statistics
  const toolStats = await getToolStatistics()
  const totalTools = toolStats.total

  return (
    <ToolsView
      title="Tools"
      subtitle={`${totalTools} tools across ${categoriesWithCounts.length} categories`}
      toolCategories={categoriesWithCounts}
    />
  )
}
