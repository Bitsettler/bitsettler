import type { ToolWithStats } from '@/lib/spacetime-db-new/modules/tools/flows'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getLowestRarity } from '@/lib/spacetime-db-new/shared/utils/rarity'
import { TagPageView } from '@/views/tag-views/tag-page-view'

interface ToolsIndividualTagPageViewProps {
  tagName: string
  tools: ToolWithStats[]
  backLink?: string
  backLinkText?: string
}

export function ToolsIndividualTagPageView({
  tagName,
  tools,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: ToolsIndividualTagPageViewProps) {
  // Get the lowest available rarity for tools, then filter by that rarity and volume > 0
  const lowestRarity = getLowestRarity(tools)
  const filteredTools = tools.filter(
    (tool) => tool.item.rarity.tag === lowestRarity && tool.item.volume > 0
  )

  // Deduplicate by name+tier (keep only one tool per name+tier combination)
  const deduplicatedTools = filteredTools.reduce(
    (acc, tool) => {
      const key = `${tool.item.name}_T${tool.item.tier}`
      if (!acc[key]) {
        acc[key] = tool
      }
      return acc
    },
    {} as Record<string, ToolWithStats>
  )

  const toolsList = Object.values(deduplicatedTools)

  // Create single group for all tools
  const itemGroups = [
    {
      name: tagName,
      items: toolsList.map((tool) => ({
        ...tool.item,
        // Add tool stats as properties
        level: tool.toolData.level,
        power: tool.toolData.power,
        toolType: tool.toolType.name
      })),
      columns: [
        { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
        { key: 'name', label: 'Name', sortable: true },
        {
          key: 'tier',
          label: 'Tier',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'level',
          label: 'Level',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'power',
          label: 'Power',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'toolType',
          label: 'Type',
          sortable: true,
          className: 'text-center'
        }
      ]
    }
  ]

  // Tools statistics
  const totalTools = tools.length
  const tagSlug = createSlug(tagName)

  return (
    <TagPageView
      title={tagName}
      subtitle={`${totalTools} tools in this category`}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
      enableItemLinks={true}
      tagSlug={tagSlug}
    />
  )
}
