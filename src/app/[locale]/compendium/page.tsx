import cargoDescData from '@/data/global/cargo_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { CompendiumIndexPageView } from '@/views/compendium-index-page-view/compendium-index-page-view'

// Transform the JSON data to match the type structure
type ItemDescWithSnakeCase = Omit<ItemDesc, 'compendiumEntry'> & { compendium_entry: boolean }
type CargoDescWithSnakeCase = Omit<CargoDesc, 'compendiumEntry'> & { compendium_entry: boolean }
type ResourceDescWithSnakeCase = Omit<ResourceDesc, 'compendiumEntry'> & { compendium_entry: boolean }

export default function CompendiumPage() {
  // Cast JSON data to handle snake_case vs camelCase mismatch
  const itemData = itemDescData as unknown as ItemDescWithSnakeCase[]
  const cargoData = cargoDescData as unknown as CargoDescWithSnakeCase[]
  const resourceData = resourceDescData as unknown as ResourceDescWithSnakeCase[]

  // Filter only compendium entries
  const items = itemData.filter((item) => item.compendium_entry)
  const cargo = cargoData.filter((cargo) => cargo.compendium_entry)
  const resources = resourceData.filter((resource) => resource.compendium_entry)

  // Extract unique categories
  const itemCategories = [...new Set(items.map((item) => item.tag))].filter(Boolean).sort()
  const cargoCategories = [...new Set(cargo.map((cargo) => cargo.tag))].filter(Boolean).sort()
  const resourceCategories = [...new Set(resources.map((resource) => resource.tag))].filter(Boolean).sort()

  // Calculate statistics
  const stats = {
    items: items.length,
    cargo: cargo.length,
    resources: resources.length,
    total: items.length + cargo.length + resources.length
  }

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
    }
  ]

  const sections = [
    {
      title: 'Items',
      totalCount: stats.items,
      categories: itemCategories.map(category => ({
        tag: category,
        count: items.filter(item => item.tag === category).length
      }))
    },
    {
      title: 'Cargo',
      totalCount: stats.cargo,
      categories: cargoCategories.map(category => ({
        tag: category,
        count: cargo.filter(item => item.tag === category).length
      }))
    },
    {
      title: 'Resources',
      totalCount: stats.resources,
      categories: resourceCategories.map(category => ({
        tag: category,
        count: resources.filter(item => item.tag === category).length
      }))
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
