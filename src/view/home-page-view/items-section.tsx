import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import {
  filterArmor,
  filterClothing,
  filterConsumables,
  filterMaterials,
  filterTools,
  filterWeapons
} from '@/lib/spacetime-db'

interface ItemsSectionProps {
  items: any[]
  cargo: any[]
  resources: any[]
}

interface ItemCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
  color: string
  href: string
}

function ItemCategoryCard({ category }: { category: ItemCategory }) {
  return (
    <Link href={category.href} className="block h-full">
      <Card className="group flex h-full flex-col transition-all hover:scale-[1.02] hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
                <span className="text-2xl">{category.icon}</span>
              </div>
              <div>
                <CardTitle className="group-hover:text-primary text-lg transition-colors">{category.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{category.count} items</p>
              </div>
            </div>
            <Badge variant="outline" className={category.color}>
              Browse
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <CardDescription className="line-clamp-3 text-sm">{category.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ItemsSection({ items, cargo, resources }: ItemsSectionProps) {
  // Convert to compendium entities for filtering
  const compendiumItems = items.map((item) => ({
    ...item,
    entityType: 'item' as const,
    compendiumEntry: true
  }))

  const compendiumCargo = cargo.map((item) => ({
    ...item,
    entityType: 'cargo' as const,
    compendiumEntry: true
  }))

  const compendiumResources = resources.map((item) => ({
    ...item,
    entityType: 'resource' as const,
    compendiumEntry: true
  }))

  // Filter items by categories
  const weapons = filterWeapons(compendiumItems)
  const armor = filterArmor(compendiumItems)
  const clothing = filterClothing(compendiumItems)
  const tools = filterTools(compendiumItems)
  const consumables = filterConsumables(compendiumItems)
  const materials = filterMaterials(compendiumItems)

  // Calculate equipment count (weapons + armor + clothing)
  const equipmentCount = weapons.length + armor.length + clothing.length

  // Calculate "others" count (remaining items not in specific categories)
  const categorizedItemsCount =
    weapons.length + armor.length + clothing.length + tools.length + consumables.length + materials.length
  const othersCount = items.length - categorizedItemsCount

  const itemCategories: ItemCategory[] = [
    {
      id: 'equipment',
      name: 'Equipment',
      description: 'Weapons, armor, and clothing to gear up your character for adventures and combat',
      icon: '⚔️',
      count: equipmentCount,
      color: 'bg-red-100 border-red-200 text-red-800',
      href: '/compendium/equipment'
    },
    {
      id: 'tools',
      name: 'Tools',
      description: 'Essential tools for crafting, gathering, building, and various professional activities',
      icon: '🔨',
      count: tools.length,
      color: 'bg-blue-100 border-blue-200 text-blue-800',
      href: '/compendium/tools'
    },
    {
      id: 'consumables',
      name: 'Consumables',
      description: 'Food, potions, and other items that provide temporary benefits when consumed',
      icon: '🍖',
      count: consumables.length,
      color: 'bg-green-100 border-green-200 text-green-800',
      href: '/compendium/consumables'
    },
    {
      id: 'cargo',
      name: 'Cargo',
      description: 'Packaged goods, animals, and bulk items for trading and transportation',
      icon: '📦',
      count: cargo.length,
      color: 'bg-purple-100 border-purple-200 text-purple-800',
      href: '/compendium/cargo'
    },
    {
      id: 'resources',
      name: 'Resources',
      description: 'Raw materials, ores, plants, and other natural resources for crafting',
      icon: '🌿',
      count: resources.length,
      color: 'bg-emerald-100 border-emerald-200 text-emerald-800',
      href: '/compendium/resources'
    },
    {
      id: 'others',
      name: 'Others',
      description: "Miscellaneous items, materials, and special objects that don't fit other categories",
      icon: '📋',
      count: othersCount,
      color: 'bg-gray-100 border-gray-200 text-gray-800',
      href: '/compendium/others'
    }
  ]

  const totalItems = items.length + cargo.length + resources.length

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Items & Equipment</h2>
        <p className="text-muted-foreground">Discover all the items, equipment, and resources available in Bitcraft</p>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span>{totalItems} Total Items</span>
          <span>•</span>
          <span>{items.length} Items</span>
          <span>•</span>
          <span>{cargo.length} Cargo</span>
          <span>•</span>
          <span>{resources.length} Resources</span>
        </div>
      </div>

      {/* Item Categories Grid */}
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itemCategories.map((category) => (
          <ItemCategoryCard key={category.id} category={category} />
        ))}
      </div>

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          🔍 Click on any category to explore detailed item information, stats, and crafting recipes!
        </p>
      </div>
    </div>
  )
}
