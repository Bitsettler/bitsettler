import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import type { ToolTypeDesc } from '@/data/bindings/tool_type_desc_type'
import { getAllTools, getToolDescByItemId, getToolTypeById } from '../commands'

export interface ToolWithStats {
  item: ItemDesc
  toolData: ToolDesc
  toolType: ToolTypeDesc
}

/**
 * Get tools with enriched data by joining item, tool description, and tool type information
 */
export function getToolsWithStats(): ToolWithStats[] {
  const tools = getAllTools()

  const results: ToolWithStats[] = []

  for (const item of tools) {
    const toolData = getToolDescByItemId(item.id)
    if (!toolData) continue

    const toolType = getToolTypeById(toolData.toolType)
    if (!toolType) continue

    results.push({
      item,
      toolData,
      toolType
    })
  }

  // Sort by tool type, then by tier, then by power
  return results.sort((a, b) => {
    // First sort by tool type name
    if (a.toolType.name !== b.toolType.name) {
      return a.toolType.name.localeCompare(b.toolType.name)
    }
    // Then sort by tier
    if (a.item.tier !== b.item.tier) {
      return a.item.tier - b.item.tier
    }
    // Finally sort by power (higher power first)
    return b.toolData.power - a.toolData.power
  })
}