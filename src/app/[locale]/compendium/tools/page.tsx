import { getToolCategories, getToolStatistics } from '@/lib/spacetime-db-new/modules/tools/flows'
import { ToolsView } from '@/views/tools-views/tools-index-page-view'

export default async function ToolsPage() {
  // Get tool categories with counts from new SDK-based system
  const toolCategories = getToolCategories()
  
  // Get live tool statistics
  const toolStats = getToolStatistics()
  const totalTools = toolStats.total

  return (
    <ToolsView
      title="Tools"
      subtitle={`${totalTools} tools across ${toolCategories.length} categories`}
      toolCategories={toolCategories}
    />
  )
}
