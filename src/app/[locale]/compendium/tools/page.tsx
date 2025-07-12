import { tagCollections } from '@/lib/spacetime-db/items/tag-collections'
import { ItemTag } from '@/lib/spacetime-db/items/tags'
import { getItemsByTags } from '@/lib/spacetime-db/items/utils'
import { ToolsView } from '@/views/tools-index-page-view/tools-view'

export default function ToolsPage() {
  // Define tool categories based on tag collections
  const toolCategories = [
    // Forestry Tools
    {
      id: 'forester-tool',
      name: 'Forester Tools',
      description: 'Axes for cutting trees and harvesting wood',
      icon: '🪓',
      tag: ItemTag.ForesterTool,
      category: 'Gathering' as const,
      href: '/compendium/forester-tool'
    },
    {
      id: 'carpenter-tool',
      name: 'Carpenter Tools',
      description: 'Saws for processing wood and carpentry',
      icon: '🪚',
      tag: ItemTag.CarpenterTool,
      category: 'Crafting' as const,
      href: '/compendium/carpenter-tool'
    },

    // Mining Tools
    {
      id: 'miner-tool',
      name: 'Miner Tools',
      description: 'Pickaxes for mining ore and stone',
      icon: '⛏️',
      tag: ItemTag.MinerTool,
      category: 'Gathering' as const,
      href: '/compendium/miner-tool'
    },
    {
      id: 'mason-tool',
      name: 'Mason Tools',
      description: 'Chisels for stonework and masonry',
      icon: '🔨',
      tag: ItemTag.MasonTool,
      category: 'Crafting' as const,
      href: '/compendium/mason-tool'
    },

    // Crafting Tools
    {
      id: 'blacksmith-tool',
      name: 'Blacksmith Tools',
      description: 'Hammers for metalworking and smithing',
      icon: '🔨',
      tag: ItemTag.BlacksmithTool,
      category: 'Crafting' as const,
      href: '/compendium/blacksmith-tool'
    },
    {
      id: 'leatherworker-tool',
      name: 'Leatherworker Tools',
      description: 'Knives for leather working and hide processing',
      icon: '🔪',
      tag: ItemTag.LeatherworkerTool,
      category: 'Crafting' as const,
      href: '/compendium/leatherworker-tool'
    },
    {
      id: 'tailor-tool',
      name: 'Tailor Tools',
      description: 'Scissors for cloth work and tailoring',
      icon: '✂️',
      tag: ItemTag.TailorTool,
      category: 'Crafting' as const,
      href: '/compendium/tailor-tool'
    },
    {
      id: 'scholar-tool',
      name: 'Scholar Tools',
      description: 'Quills for research and knowledge work',
      icon: '🪶',
      tag: ItemTag.ScholarTool,
      category: 'Crafting' as const,
      href: '/compendium/scholar-tool'
    },

    // Gathering Tools
    {
      id: 'farmer-tool',
      name: 'Farmer Tools',
      description: 'Hoes for farming and agriculture',
      icon: '🌾',
      tag: ItemTag.FarmerTool,
      category: 'Gathering' as const,
      href: '/compendium/farmer-tool'
    },
    {
      id: 'fisher-tool',
      name: 'Fisher Tools',
      description: 'Rods for fishing and aquatic harvesting',
      icon: '🎣',
      tag: ItemTag.FisherTool,
      category: 'Gathering' as const,
      href: '/compendium/fisher-tool'
    },
    {
      id: 'forager-tool',
      name: 'Forager Tools',
      description: 'Pots for foraging and item collection',
      icon: '🧺',
      tag: ItemTag.ForagerTool,
      category: 'Gathering' as const,
      href: '/compendium/forager-tool'
    },
    {
      id: 'hunter-tool',
      name: 'Hunter Tools',
      description: 'Machetes for hunting and combat preparation',
      icon: '🏹',
      tag: ItemTag.HunterTool,
      category: 'Gathering' as const,
      href: '/compendium/hunter-tool'
    }
  ]

  // Get item counts for each category
  const categoriesWithCounts = toolCategories.map((category) => {
    const items = getItemsByTags([category.tag])
    return {
      ...category,
      count: items.length
    }
  })

  // Calculate total tools using tagCollections to ensure consistency
  const totalTools = tagCollections.tools.tags.reduce((total, tag) => {
    return total + getItemsByTags([tag]).length
  }, 0)

  return (
    <ToolsView
      title="Tools"
      subtitle={`${totalTools} tools across ${categoriesWithCounts.length} categories`}
      toolCategories={categoriesWithCounts}
    />
  )
}
