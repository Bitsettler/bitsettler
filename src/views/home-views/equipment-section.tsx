import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { tagCollections } from '@/lib/spacetime-db-new/modules/collections/item-tag-collections'
import { getItemsByTags } from '@/lib/spacetime-db-new/modules/items/commands'

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

export function EquipmentSection() {
  const weaponsCount = getItemsByTags(tagCollections.weapons.tags).length
  const toolsCount = getItemsByTags(tagCollections.tools.tags).length
  const equipmentCount = tagCollections.equipment.tags.reduce((total, tag) => {
    return total + getItemsByTags([tag]).length
  }, 0)
  const collectiblesCount = tagCollections.collectibles.tags.reduce((total, tag) => {
    return total + getItemsByTags([tag]).length
  }, 0)

  const equipmentCategories: ItemCategory[] = [
    {
      id: 'weapon',
      name: 'Weapon',
      description: 'Weapons to gear up your character',
      icon: '⚔️',
      count: weaponsCount,
      href: '/compendium/weapon'
    },
    {
      id: 'equipment',
      name: 'Equipment',
      description: 'Armor, clothings, jewelry and more',
      icon: '🛡️',
      count: equipmentCount,
      href: '/compendium/equipment'
    },
    {
      id: 'tools',
      name: 'Tools',
      description: 'Essential tools for crafting, gathering, and building',
      icon: '🔨',
      count: toolsCount,
      href: '/compendium/tools'
    },
    {
      id: 'collectibles',
      name: 'Collectibles',
      description: 'Deeds, writs, and other special items',
      icon: '📜',
      count: collectiblesCount,
      href: '/compendium/collectibles'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Equipment & Collectibles</h2>
        <p className="text-muted-foreground">Browse equipment categories by type</p>
      </div>
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equipmentCategories.map((category) => (
          <ItemCategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  )
}
