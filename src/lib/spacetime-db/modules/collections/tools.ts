import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import type { ToolTypeDesc } from '@/data/bindings/tool_type_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import toolDescData from '@/data/global/tool_desc.json'
import toolTypeDescData from '@/data/global/tool_type_desc.json'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'

// Combined tool data with item information and computed properties
export interface ToolWithItem extends ToolDesc {
  item: ItemDesc
  toolTypeName: string
  toolTypeData?: ToolTypeDesc
  powerRange: string
  efficiency: number
  rarityLevel: string
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
 * Get tool type by ID with full type data
 */
export async function getToolTypeById(toolTypeId: number): Promise<ToolTypeDesc | undefined> {
  const toolTypes = await getToolTypes()
  return toolTypes.find((type) => type.id === toolTypeId)
}

/**
 * Calculate tool efficiency based on power and level
 */
function calculateToolEfficiency(tool: ToolDesc): number {
  // Efficiency = power * level, normalized to a 0-100 scale
  const baseEfficiency = tool.power * tool.level
  // Normalize to a reasonable scale (assuming max power ~100, max level ~10)
  return Math.min(Math.round(baseEfficiency / 10), 100)
}

/**
 * Get power range description for tools
 */
function getToolPowerRange(power: number): string {
  if (power >= 80) return 'Exceptional'
  if (power >= 60) return 'High'
  if (power >= 40) return 'Medium'
  if (power >= 20) return 'Low'
  return 'Basic'
}

/**
 * Get rarity level based on tier
 */
function getToolRarityLevel(tier: number): string {
  if (tier >= 5) return 'Legendary'
  if (tier >= 4) return 'Epic'
  if (tier >= 3) return 'Rare'
  if (tier >= 2) return 'Uncommon'
  return 'Common'
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

  const results: ToolWithItem[] = []

  for (const item of toolItems) {
    const toolData = toolDesc.find((tool) => tool.itemId === item.id)
    if (toolData) {
      // Find tool type with proper typing and error handling
      const toolTypeData = toolTypeDesc.find((type) => type.id === toolData.toolType)
      const toolTypeName = toolTypeData?.name || 'Unknown'

      // Calculate computed properties
      const powerRange = getToolPowerRange(toolData.power)
      const efficiency = calculateToolEfficiency(toolData)
      const rarityLevel = getToolRarityLevel(item.tier)

      results.push({
        ...toolData,
        item,
        toolTypeName,
        toolTypeData,
        powerRange,
        efficiency,
        rarityLevel
      })
    }
  }

  return results
}

/**
 * Get tools grouped by tool type, sorted by tier then by power
 */
export async function getToolsGroupedByType(): Promise<Record<string, ToolWithItem[]>> {
  const tools = await getToolsWithStats()

  const grouped: Record<string, ToolWithItem[]> = {}

  for (const tool of tools) {
    const typeName = tool.toolTypeName
    if (!grouped[typeName]) {
      grouped[typeName] = []
    }
    grouped[typeName].push(tool)
  }

  // Sort each group by tier, then by power, then by name
  for (const toolType in grouped) {
    grouped[toolType].sort((a, b) => {
      // First sort by tier
      if (a.item.tier !== b.item.tier) {
        return a.item.tier - b.item.tier
      }
      // Then sort by power (higher power first)
      if (a.power !== b.power) {
        return b.power - a.power
      }
      // Finally sort by name
      return a.item.name.localeCompare(b.item.name)
    })
  }

  return grouped
}

/**
 * Get tools grouped by rarity level
 */
export async function getToolsGroupedByRarity(): Promise<Record<string, ToolWithItem[]>> {
  const tools = await getToolsWithStats()

  const grouped: Record<string, ToolWithItem[]> = {}

  for (const tool of tools) {
    const rarity = tool.rarityLevel
    if (!grouped[rarity]) {
      grouped[rarity] = []
    }
    grouped[rarity].push(tool)
  }

  // Sort each group by tool type, then by tier, then by power
  for (const rarity in grouped) {
    grouped[rarity].sort((a, b) => {
      // First sort by tool type
      if (a.toolTypeName !== b.toolTypeName) {
        return a.toolTypeName.localeCompare(b.toolTypeName)
      }
      // Then sort by tier
      if (a.item.tier !== b.item.tier) {
        return a.item.tier - b.item.tier
      }
      // Finally sort by power
      return b.power - a.power
    })
  }

  return grouped
}

/**
 * Get tools grouped by power range
 */
export async function getToolsGroupedByPowerRange(): Promise<Record<string, ToolWithItem[]>> {
  const tools = await getToolsWithStats()

  const grouped: Record<string, ToolWithItem[]> = {}

  for (const tool of tools) {
    const powerRange = tool.powerRange
    if (!grouped[powerRange]) {
      grouped[powerRange] = []
    }
    grouped[powerRange].push(tool)
  }

  // Sort each group by tool type, then by power
  for (const powerRange in grouped) {
    grouped[powerRange].sort((a, b) => {
      // First sort by tool type
      if (a.toolTypeName !== b.toolTypeName) {
        return a.toolTypeName.localeCompare(b.toolTypeName)
      }
      // Then sort by power (descending)
      return b.power - a.power
    })
  }

  return grouped
}

/**
 * Get tool statistics overview with enhanced analysis
 */
export async function getToolStatistics() {
  const tools = await getToolsWithStats()
  const toolTypes = await getToolTypes()
  const toolsByType = await getToolsGroupedByType()
  const toolsByRarity = await getToolsGroupedByRarity()
  const toolsByPowerRange = await getToolsGroupedByPowerRange()

  const totalTools = tools.length
  const typeCount = Object.keys(toolsByType).length

  // Calculate tier distribution
  const tierDistribution: Record<number, number> = {}
  tools.forEach((tool) => {
    tierDistribution[tool.item.tier] = (tierDistribution[tool.item.tier] || 0) + 1
  })

  // Calculate rarity distribution
  const rarityDistribution: Record<string, number> = {}
  tools.forEach((tool) => {
    rarityDistribution[tool.rarityLevel] = (rarityDistribution[tool.rarityLevel] || 0) + 1
  })

  // Calculate power range distribution
  const powerRangeDistribution: Record<string, number> = {}
  tools.forEach((tool) => {
    powerRangeDistribution[tool.powerRange] = (powerRangeDistribution[tool.powerRange] || 0) + 1
  })

  // Calculate power statistics
  const powers = tools.map((t) => t.power)
  const powerStats =
    powers.length > 0
      ? {
          minPower: Math.min(...powers),
          maxPower: Math.max(...powers),
          avgPower: Math.round(powers.reduce((sum, power) => sum + power, 0) / powers.length)
        }
      : {
          minPower: 0,
          maxPower: 0,
          avgPower: 0
        }

  // Calculate efficiency statistics
  const efficiencies = tools.map((t) => t.efficiency)
  const efficiencyStats =
    efficiencies.length > 0
      ? {
          minEfficiency: Math.min(...efficiencies),
          maxEfficiency: Math.max(...efficiencies),
          avgEfficiency: Math.round(efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length)
        }
      : {
          minEfficiency: 0,
          maxEfficiency: 0,
          avgEfficiency: 0
        }

  return {
    total: totalTools,
    types: typeCount,
    availableTypes: toolTypes.length,
    tierDistribution,
    rarityDistribution,
    powerRangeDistribution,
    powerStats,
    efficiencyStats,
    toolsByType: Object.entries(toolsByType).map(([type, toolList]) => ({
      type,
      count: toolList.length,
      avgPower: toolList.length > 0 ? Math.round(toolList.reduce((sum, t) => sum + t.power, 0) / toolList.length) : 0,
      avgEfficiency:
        toolList.length > 0 ? Math.round(toolList.reduce((sum, t) => sum + t.efficiency, 0) / toolList.length) : 0
    })),
    toolsByRarity: Object.entries(toolsByRarity).map(([rarity, toolList]) => ({
      rarity,
      count: toolList.length
    })),
    toolsByPowerRange: Object.entries(toolsByPowerRange).map(([powerRange, toolList]) => ({
      powerRange,
      count: toolList.length
    }))
  }
}
