import type { ToolWithItem } from '@/lib/spacetime-db-live/tools'
import { TagPageView } from '@/views/tag-page-view/tag-page-view'

interface ToolsIndividualTagPageViewProps {
  tagName: string
  tools: ToolWithItem[]
  backLink?: string
  backLinkText?: string
}

export function ToolsIndividualTagPageView({
  tagName,
  tools,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: ToolsIndividualTagPageViewProps) {
  // Deduplicate by tier (keep only one tool per tier)
  const deduplicatedTools = tools.reduce(
    (acc, tool) => {
      const key = `${tool.item.name}_T${tool.item.tier}`
      if (!acc[key]) {
        acc[key] = tool
      }
      return acc
    },
    {} as Record<string, ToolWithItem>
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
  const totalTools = tools.length

  return (
    <TagPageView
      title={tagName}
      subtitle={`${totalTools} tools in this category`}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
    />
  )
}
