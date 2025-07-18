import { getCargoCategoriesCommand } from '@/lib/spacetime-db/modules/cargo/commands/get-cargo-categories'
import { getItemsCategoriesCommand } from '@/lib/spacetime-db/modules/items/commands/get-items-categories'
import { getItemsStatisticsCommand } from '@/lib/spacetime-db/modules/items/commands/get-items-statistics'
import { getResourcesCategoriesCommand } from '@/lib/spacetime-db/modules/resources/commands/get-resources-categories'
import { CompendiumIndexPageView } from '@/views/compendium-views/compendium-index-page-view'

export default function CompendiumPage() {
  // Call individual module commands to get category data
  const itemCategories = getItemsCategoriesCommand()
  const itemStats = getItemsStatisticsCommand()
  const cargoCategories = getCargoCategoriesCommand()
  const resourceCategories = getResourcesCategoriesCommand()

  // Prepare data for the view component
  const specialCollections = [
    {
      href: '/compendium/weapon',
      icon: '⚔️',
      title: 'Weapons',
      description: 'All weapon types'
    },
    {
      href: '/compendium/equipment',
      icon: '🛡️',
      title: 'Equipment',
      description: 'All equipment slots'
    },
    {
      href: '/compendium/tools',
      icon: '🔨',
      title: 'Tools',
      description: 'All profession tools'
    },
    {
      href: '/compendium/consumables',
      icon: '🍎',
      title: 'Consumables',
      description: 'Food, potions & supplies'
    }
  ]

  const sections = [
    {
      title: 'Items',
      totalCount: itemStats.total,
      categories: itemCategories
    },
    {
      title: 'Cargo',
      totalCount: cargoCategories.reduce((sum, cat) => sum + cat.count, 0),
      categories: cargoCategories
    },
    {
      title: 'Resources',
      totalCount: resourceCategories.reduce((sum, cat) => sum + cat.count, 0),
      categories: resourceCategories
    }
  ]

  return (
    <CompendiumIndexPageView
      title="Bitcraft Compendium"
      subtitle="Explore all items, cargo, and resources in the world of Bitcraft"
      specialCollections={specialCollections}
      sections={sections}
    />
  )
}
