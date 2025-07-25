import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { cleanIconAssetName, getServerIconPath } from '@/lib/spacetime-db-new/shared/assets'
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
                  src={getServerIconPath(cleanIconAssetName(category.iconAssetName))}
                  alt={category.name}
                  width={44}
                  height={44}
                  className="rounded"
                />
              </div>
              <div>
                <CardTitle className="group-hover:text-primary text-lg transition-colors">{category.name}</CardTitle>
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
  const equipmentCategories: ItemCategory[] = [
    {
      id: 'weapon',
      name: 'Weapon',
      description: 'Weapons to gear up your character',
      iconAssetName: 'GeneratedIcons/Other/GeneratedIcons/Items/ClaymoreT1',
      href: '/compendium/weapon'
    },
    {
      id: 'equipment',
      name: 'Equipment',
      description: 'Armor, clothings, jewelry and more',
      iconAssetName: 'GeneratedIcons/Other/GeneratedIcons/Items/MetalTorsoT1',
      href: '/compendium/equipment'
    },
    {
      id: 'tools',
      name: 'Tools',
      description: 'Essential tools for crafting, gathering, and building',
      iconAssetName: 'GeneratedIcons/Other/GeneratedIcons/Items/Tools/RathiumHammer',
      href: '/compendium/tools'
    },
    {
      id: 'collectibles',
      name: 'Collectibles',
      description: 'Deeds, writs, and other special items',
      iconAssetName: 'GeneratedIcons/Other/Animals/DeerMale',
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
