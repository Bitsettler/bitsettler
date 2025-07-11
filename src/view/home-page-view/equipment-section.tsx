import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CollectibleDesc } from '@/data/bindings'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { Link } from '@/i18n/navigation'

interface EquipmentSectionProps {
  weapons: ItemDesc[]
  armor: ItemDesc[]
  clothing: ItemDesc[]
  tools: ItemDesc[]
  collectibles: CollectibleDesc[]
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

export function EquipmentSection({ weapons, armor, clothing, tools, collectibles }: EquipmentSectionProps) {
  const equipmentCategories: ItemCategory[] = [
    {
      id: 'weapon',
      name: 'Weapon',
      description: 'Weapons to gear up your character',
      icon: '⚔️',
      count: weapons.length,
      color: 'bg-red-100 border-red-200 text-red-800',
      href: '/compendium/weapons'
    },
    {
      id: 'metal-armor',
      name: 'Metal Armor',
      description: 'Sturdy metal armor offering high protection',
      icon: '🛡️',
      count: armor.length,
      color: 'bg-red-100 border-red-200 text-red-800',
      href: '/compendium/metal-armor'
    },
    {
      id: 'leather-clothing',
      name: 'Leather Clothing',
      description: 'Stylish leather clothing for stealth and comfort',
      icon: '👕',
      count: clothing.length,
      color: 'bg-red-100 border-red-200 text-red-800',
      href: '/compendium/leather-clothing'
    },
    {
      id: 'cloth-clothing',
      name: 'Cloth Clothing',
      description: 'Cloth clothing for style and comfort',
      icon: '👗',
      count: clothing.length,
      color: 'bg-red-100 border-red-200 text-red-800',
      href: '/compendium/cloth-clothing'
    },
    {
      id: 'tools',
      name: 'Tools',
      description: 'Essential tools for crafting, gathering, and building',
      icon: '🔨',
      count: tools.length,
      color: 'bg-blue-100 border-blue-200 text-blue-800',
      href: '/compendium/tools'
    },
    {
      id: 'collectibles',
      name: 'Collectibles',
      description: 'Deeds, writs, and other special items',
      icon: '📜',
      count: collectibles.length,
      color: 'bg-gray-100 border-gray-200 text-gray-800',
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
