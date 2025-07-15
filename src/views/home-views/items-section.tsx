import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { Link } from '@/i18n/navigation'

interface ItemsSectionProps {
  consumables: ItemDesc[]
  cargo: CargoDesc[]
  resources: ResourceDesc[]
  totalItems: number
}

interface ItemCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
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
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <CardDescription className="line-clamp-3 text-sm">{category.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ItemsSection({ consumables, cargo, resources, totalItems }: ItemsSectionProps) {
  const itemCategories: ItemCategory[] = [
    {
      id: 'consumables',
      name: 'Consumables',
      description: 'Food, potions, and other items that provide temporary benefits when consumed',
      icon: '🍖',
      count: consumables.length,
      href: '/compendium/consumables'
    },
    {
      id: 'cargo',
      name: 'Cargo',
      description: 'Packaged goods, animals, and bulk items for trading and transportation',
      icon: '📦',
      count: cargo.length,
      href: '/compendium/cargo'
    },
    {
      id: 'resources',
      name: 'Resources',
      description: 'Raw materials, ores, plants, and other natural resources for crafting',
      icon: '🌿',
      count: resources.length,
      href: '/compendium/resources'
    },
    {
      id: 'all',
      name: 'See all items',
      description: 'Browse the full item compendium',
      icon: '📋',
      count: totalItems,
      href: '/compendium'
    }
  ]

  // Use totalItems count passed from parent component
  const totalItemsCount = totalItems

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Items & Resources</h2>
        <p className="text-muted-foreground">Discover all the items, equipment, and resources available in Bitcraft</p>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span>{totalItemsCount} Total Items</span>
          <span>•</span>
          <span>{consumables.length} Items</span>
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
    </div>
  )
}
