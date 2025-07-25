import { getAllTools } from '../commands'

export interface ToolCategory {
  id: string
  name: string
  description: string
  category: 'Gathering' | 'Crafting'
  href: string
  count: number
  firstTool?: {
    name: string
    iconAssetName: string
  }
}

/**
 * Tool category metadata - maps item tags to UI categories
 */
const toolCategoryMetadata: Record<string, Omit<ToolCategory, 'count' | 'firstTool'>> = {
  'Forester Tool': {
    id: 'forester-tool',
    name: 'Forester Tools',
    description: 'Axes for cutting trees and harvesting wood',
    category: 'Gathering',
    href: '/compendium/forester-tool'
  },
  'Carpenter Tool': {
    id: 'carpenter-tool',
    name: 'Carpenter Tools',
    description: 'Saws for processing wood and carpentry',
    category: 'Crafting',
    href: '/compendium/carpenter-tool'
  },
  'Mason Tool': {
    id: 'mason-tool',
    name: 'Mason Tools',
    description: 'Chisels for stone carving and masonry',
    category: 'Crafting',
    href: '/compendium/mason-tool'
  },
  'Miner Tool': {
    id: 'miner-tool',
    name: 'Miner Tools',
    description: 'Pickaxes for mining ore and extracting resources',
    category: 'Gathering',
    href: '/compendium/miner-tool'
  },
  'Blacksmith Tool': {
    id: 'blacksmith-tool',
    name: 'Blacksmith Tools',
    description: 'Hammers for forging metals and crafting',
    category: 'Crafting',
    href: '/compendium/blacksmith-tool'
  },
  'Leatherworker Tool': {
    id: 'leatherworker-tool',
    name: 'Leatherworker Tools',
    description: 'Knives for processing leather and hides',
    category: 'Crafting',
    href: '/compendium/leatherworker-tool'
  },
  'Hunter Tool': {
    id: 'hunter-tool',
    name: 'Hunter Tools',
    description: 'Bows for hunting animals and gathering meat',
    category: 'Gathering',
    href: '/compendium/hunter-tool'
  },
  'Tailor Tool': {
    id: 'tailor-tool',
    name: 'Tailor Tools',
    description: 'Scissors for tailoring and fabric work',
    category: 'Crafting',
    href: '/compendium/tailor-tool'
  },
  'Farmer Tool': {
    id: 'farmer-tool',
    name: 'Farmer Tools',
    description: 'Hoes for farming and agricultural work',
    category: 'Gathering',
    href: '/compendium/farmer-tool'
  },
  'Fisher Tool': {
    id: 'fisher-tool',
    name: 'Fisher Tools',
    description: 'Rods for fishing and aquatic resource gathering',
    category: 'Gathering',
    href: '/compendium/fisher-tool'
  },
  'Forager Tool': {
    id: 'forager-tool',
    name: 'Forager Tools',
    description: 'Pots for foraging and gathering natural resources',
    category: 'Gathering',
    href: '/compendium/forager-tool'
  },
  'Scholar Tool': {
    id: 'scholar-tool',
    name: 'Scholar Tools',
    description: 'Quills for research and knowledge gathering',
    category: 'Crafting',
    href: '/compendium/scholar-tool'
  }
}

/**
 * Get tool categories with item counts from actual game data
 */
export function getToolCategories(): ToolCategory[] {
  const tools = getAllTools()

  // Group tools by their tag
  const toolsByTag: Record<string, { count: number; firstTool?: (typeof tools)[0] }> = {}

  tools.forEach((tool) => {
    if (!toolsByTag[tool.tag]) {
      toolsByTag[tool.tag] = { count: 0, firstTool: tool }
    }
    toolsByTag[tool.tag].count++
  })

  // Create categories with actual counts and first tool icon
  const categories: ToolCategory[] = []

  Object.entries(toolCategoryMetadata).forEach(([tag, metadata]) => {
    const toolData = toolsByTag[tag]
    if (toolData && toolData.count > 0) {
      // Only include categories that have tools
      categories.push({
        ...metadata,
        count: toolData.count,
        firstTool: toolData.firstTool
          ? {
              name: toolData.firstTool.name,
              iconAssetName: toolData.firstTool.iconAssetName
            }
          : undefined
      })
    }
  })

  // Sort by category type, then by name
  return categories.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.name.localeCompare(b.name)
  })
}
