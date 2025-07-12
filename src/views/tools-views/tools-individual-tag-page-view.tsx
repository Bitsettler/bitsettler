import { getToolsWithDetails } from '@/lib/spacetime-db/items/tools'
import { TagPageView } from '@/views/tag-page-view/tag-page-view'

interface ToolsIndividualTagPageViewProps {
  tagName: string
  backLink?: string
  backLinkText?: string
}

export function ToolsIndividualTagPageView({
  tagName,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: ToolsIndividualTagPageViewProps) {
  // Handle tools tags with enriched data
  const toolsWithDetails = getToolsWithDetails()
  const toolsForThisTag = toolsWithDetails.filter((tool) => tool.item.tag === tagName)

  // Deduplicate by tier (keep only one tool per tier)
  const deduplicatedTools = toolsForThisTag.reduce(
    (acc, tool) => {
      const key = `${tool.item.name}_T${tool.item.tier}`
      if (!acc[key]) {
        acc[key] = tool
      }
      return acc
    },
    {} as Record<string, (typeof toolsForThisTag)[0]>
  )

  const toolsList = Object.values(deduplicatedTools)

  // Create single group for all tools
  const itemGroups = [
    {
      name: tagName,
      items: toolsList.map((tool) => ({
        ...tool.item,
        // Add tool stats as properties
        level: tool.level,
        power: tool.power,
        toolType: tool.toolTypeName
      })),
      columns: [
        { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
        { key: 'level', label: 'Level', sortable: true, className: 'text-center' },
        { key: 'power', label: 'Power', sortable: true, className: 'text-center' },
        { key: 'toolType', label: 'Type', sortable: true, className: 'text-center' }
      ]
    }
  ]

  // Tools statistics
  const totalTools = toolsForThisTag.length
  const levelDistribution: Record<number, number> = {}
  toolsForThisTag.forEach((tool) => {
    levelDistribution[tool.level] = (levelDistribution[tool.level] || 0) + 1
  })

  const powerRange =
    toolsForThisTag.length > 0
      ? {
          min: Math.min(...toolsForThisTag.map((t) => t.power)),
          max: Math.max(...toolsForThisTag.map((t) => t.power))
        }
      : { min: 0, max: 0 }

  const statisticsCards = [
    {
      label: 'Total Tools',
      value: totalTools
    },
    {
      label: 'Level Range',
      value:
        Object.keys(levelDistribution).length > 0
          ? `${Math.min(...Object.keys(levelDistribution).map(Number))} - ${Math.max(...Object.keys(levelDistribution).map(Number))}`
          : '0'
    },
    {
      label: 'Power Range',
      value: totalTools > 0 ? `${powerRange.min} - ${powerRange.max}` : '0'
    },
    {
      label: 'Tool Type',
      value: toolsForThisTag[0]?.toolTypeName || 'Unknown'
    }
  ]

  return (
    <TagPageView
      title={tagName}
      subtitle={`${totalTools} tools in this category`}
      backLink={backLink}
      backLinkText={backLinkText}
      statisticsCards={statisticsCards}
      itemGroups={itemGroups}
    />
  )
}
