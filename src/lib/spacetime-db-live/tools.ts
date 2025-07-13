import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import type { ToolTypeDesc } from '@/data/bindings/tool_type_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import toolDescData from '@/data/global/tool_desc.json'
import toolTypeDescData from '@/data/global/tool_type_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Combined tool data with item information
export interface ToolWithItem extends ToolDesc {
  item: ItemDesc
  toolTypeName: string
}

/**
 * Get tool-related data from static JSON files
 */
function getToolData() {
  return {
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    toolDesc: camelCaseDeep<ToolDesc[]>(toolDescData),
    toolTypeDesc: camelCaseDeep<ToolTypeDesc[]>(toolTypeDescData)
  }
}

/**
 * Get all tool items from live data
 */
export async function getToolItems(): Promise<ItemDesc[]> {
  const { itemDesc } = getToolData()
  return itemDesc.filter((item) => item.compendiumEntry && item.tag === 'Tool')
}

/**
 * Get all tool stats from live data
 */
export async function getToolStats(): Promise<ToolDesc[]> {
  const { toolDesc } = getToolData()
  return toolDesc
}

/**
 * Get all tool types from live data
 */
export async function getToolTypes(): Promise<ToolTypeDesc[]> {
  const { toolTypeDesc } = getToolData()
  return toolTypeDesc
}

/**
 * Get tool type name by ID
 */
export async function getToolTypeName(toolTypeId: number): Promise<string> {
  const toolTypes = await getToolTypes()
  const toolType = toolTypes.find((type) => type.id === toolTypeId)
  return toolType?.name || 'Unknown'
}

/**
 * Alias for getToolsWithStats for consistency with other modules
 */
export async function getToolsWithItems(): Promise<ToolWithItem[]> {
  return getToolsWithStats()
}

/**
 * Combine tool items with their stats and tool type information
 */
export async function getToolsWithStats(): Promise<ToolWithItem[]> {
  const { itemDesc, toolDesc, toolTypeDesc } = getToolData()

  const toolItems = itemDesc.filter((item) => item.compendiumEntry && item.tag.includes('Tool'))
  const toolStats = toolDesc

  const results: ToolWithItem[] = []

  for (const item of toolItems) {
    const stats = toolStats.find((stat) => stat.itemId === item.id)
    if (stats) {
      const toolType = toolTypeDesc.find((type) => type.id === stats.toolType)
      const toolTypeName = toolType?.name || 'Unknown'

      results.push({
        ...stats,
        item,
        toolTypeName
      })
    }
  }

  return results
}

/**
 * Get tools grouped by tool type, sorted by tier
 */
export async function getToolsGroupedByType(): Promise<Record<string, ToolWithItem[]>> {
  const tools = await getToolsWithStats()

  const grouped: Record<string, ToolWithItem[]> = {}

  for (const tool of tools) {
    if (!grouped[tool.toolTypeName]) {
      grouped[tool.toolTypeName] = []
    }
    grouped[tool.toolTypeName].push(tool)
  }

  // Sort each group by tier
  for (const toolType in grouped) {
    grouped[toolType].sort((a, b) => a.item.tier - b.item.tier)
  }

  return grouped
}

/**
 * Get tool statistics overview
 */
export async function getToolStatistics() {
  const tools = await getToolsWithStats()
  const toolTypes = await getToolTypes()

  const totalTools = tools.length
  const toolsByType = await getToolsGroupedByType()
  const typeCount = Object.keys(toolsByType).length

  const tierDistribution: Record<number, number> = {}
  tools.forEach((tool) => {
    tierDistribution[tool.item.tier] = (tierDistribution[tool.item.tier] || 0) + 1
  })

  return {
    total: totalTools,
    types: typeCount,
    availableTypes: toolTypes.length,
    tierDistribution,
    toolsByType: Object.entries(toolsByType).map(([type, tools]) => ({
      type,
      count: tools.length
    }))
  }
}
