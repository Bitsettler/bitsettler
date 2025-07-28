import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import {
  cleanIconAssetName,
  getServerIconPath
} from '@/lib/spacetime-db-new/shared/assets'
import Image from 'next/image'

interface ItemCategory {
  id: string
  name: string
  description: string
  iconAssetName: string
  href: string
}

function ItemCategoryCard({ category }: { category: ItemCategory }) {
  return (
    <Link href={category.href} className="block h-full">
      <Card className="group flex h-full flex-col transition-all hover:scale-[1.02] hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-lg">
                <Image
                  src={getServerIconPath(
                    cleanIconAssetName(category.iconAssetName)
                  )}
                  alt={category.name}
                  width={44}
                  height={44}
                  className="rounded"
                />
              </div>
              <div>
                <CardTitle className="group-hover:text-primary text-lg transition-colors">
                  {category.name}
                </CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <CardDescription className="line-clamp-3 text-sm">
            {category.description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ItemsSection() {
  const itemCategories: ItemCategory[] = [
    {
      id: 'consumables',
      name: 'Consumables',
      description:
        'Food, potions, and other items that provide temporary benefits when consumed',
      iconAssetName: 'GeneratedIcons/Other/GeneratedIcons/Items/HealingPotion',
      href: '/compendium/consumables'
    },
    {
      id: 'cargo',
      name: 'Cargo',
      description:
        'Packaged goods, animals, and bulk items for trading and transportation',
      iconAssetName: 'GeneratedIcons/Cargo/Supplies/SupplyPack',
      href: '/compendium/cargo'
    },
    {
      id: 'resources',
      name: 'Resources',
      description:
        'Raw materials, ores, plants, and other natural resources for crafting',
      iconAssetName: 'GeneratedIcons/Other/GeneratedIcons/Items/Log',
      href: '/compendium/resources'
    },
    {
      id: 'all',
      name: 'See all items',
      description: 'Browse the full item compendium',
      iconAssetName: 'GeneratedIcons/Items/Codex',
      href: '/compendium'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Items & Resources</h2>
        <p className="text-muted-foreground">
          Discover all the items, equipment, and resources available in Bitcraft
        </p>
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
