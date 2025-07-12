import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import type { ToolTypeDesc } from '@/data/bindings/tool_type_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import toolDescData from '@/data/global/tool_desc.json'
import toolTypeDescData from '@/data/global/tool_type_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Combined tool data with item information and tool type details
export interface ToolWithDetails extends ToolDesc {
  item: ItemDesc
  toolTypeName: string
  skillId: number
}

/**
 * Get all tool items from item_desc.json by matching tool_desc item_ids
 */
export function getToolItems(): ItemDesc[] {
  const itemData = camelCaseDeep<ItemDesc[]>(itemDescData)
  const toolStats = getToolStats()
  const toolItemIds = new Set(toolStats.map(stat => stat.itemId))
  
  return itemData.filter((item) => 
    item.compendiumEntry && toolItemIds.has(item.id)
  )
}

/**
 * Get all tool stats from tool_desc.json
 */
export function getToolStats(): ToolDesc[] {
  return camelCaseDeep<ToolDesc[]>(toolDescData)
}

/**
 * Get all tool type descriptions from tool_type_desc.json
 */
export function getToolTypes(): ToolTypeDesc[] {
  return camelCaseDeep<ToolTypeDesc[]>(toolTypeDescData)
}

/**
 * Combine tool items with their stats and type information
 */
export function getToolsWithDetails(): ToolWithDetails[] {
  const toolItems = getToolItems()
  const toolStats = getToolStats()
  const toolTypes = getToolTypes()
  
  // Create lookup maps for efficiency
  const toolStatsMap = new Map(toolStats.map(stat => [stat.itemId, stat]))
  const toolTypesMap = new Map(toolTypes.map(type => [type.id, type]))
  
  const results: ToolWithDetails[] = []
  
  for (const item of toolItems) {
    const toolStat = toolStatsMap.get(item.id)
    if (toolStat) {
      const toolType = toolTypesMap.get(toolStat.toolType)
      
      results.push({
        ...toolStat,
        item,
        toolTypeName: toolType?.name || 'Unknown',
        skillId: toolType?.skillId || 0
      })
    }
  }
  
  return results
}

/**
 * Get tools grouped by tool type, sorted by level and tier
 */
export function getToolsGroupedByType(): Record<string, ToolWithDetails[]> {
  const tools = getToolsWithDetails()
  
  const grouped: Record<string, ToolWithDetails[]> = {}
  
  for (const tool of tools) {
    const typeName = tool.toolTypeName
    if (!grouped[typeName]) {
      grouped[typeName] = []
    }
    grouped[typeName].push(tool)
  }
  
  // Sort each group by level (ascending) then by tier (ascending)
  for (const toolType in grouped) {
    grouped[toolType].sort((a, b) => {
      // Primary sort: level
      if (a.level !== b.level) {
        return a.level - b.level
      }
      // Secondary sort: tier
      return a.item.tier - b.item.tier
    })
  }
  
  return grouped
}

/**
 * Get tool statistics overview
 */
export function getToolStatistics() {
  const toolsByType = getToolsGroupedByType()
  const totalTools = Object.values(toolsByType).reduce((total, tools) => total + tools.length, 0)
  
  // Calculate level distribution
  const levelDistribution: Record<number, number> = {}
  Object.values(toolsByType).flat().forEach(tool => {
    levelDistribution[tool.level] = (levelDistribution[tool.level] || 0) + 1
  })
  
  // Calculate power range
  const allTools = Object.values(toolsByType).flat()
  const powers = allTools.map(tool => tool.power)
  const minPower = Math.min(...powers)
  const maxPower = Math.max(...powers)
  
  return {
    total: totalTools,
    types: Object.keys(toolsByType).length,
    levelRange: {
      min: Math.min(...Object.keys(levelDistribution).map(Number)),
      max: Math.max(...Object.keys(levelDistribution).map(Number))
    },
    powerRange: {
      min: minPower,
      max: maxPower
    },
    toolsByType: Object.entries(toolsByType).map(([type, tools]) => ({
      type,
      count: tools.length,
      levelRange: {
        min: Math.min(...tools.map(t => t.level)),
        max: Math.max(...tools.map(t => t.level))
      }
    }))
  }
}