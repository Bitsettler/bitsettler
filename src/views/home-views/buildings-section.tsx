import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { cleanIconAssetName, getServerIconPath } from '@/lib/spacetime-db-new/shared/assets'
import Image from 'next/image'

interface BuildingCategory {
  id: string
  name: string
  description: string
  iconAssetName: string
  href: string
}

function BuildingCategoryCard({ category }: { category: BuildingCategory }) {
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

export function BuildingsSection() {
  const buildingCategories: BuildingCategory[] = [
    {
      id: 'buildings',
      name: 'Buildings',
      description: 'Structures, facilities, and architectural constructions',
      iconAssetName: 'GeneratedIcons/Other/Buildings/Enterable/EnterableT1Medium',
      href: '/compendium/buildings'
    },
    {
      id: 'writs',
      name: 'Writs & Documents',
      description: 'Construction permits and building documents',
      iconAssetName: 'GeneratedIcons/Other/GeneratedIcons/Items/TownWrit',
      href: '/compendium/writ'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Buildings & Structures</h2>
        <p className="text-muted-foreground">Browse building categories and construction documents</p>
      </div>
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {buildingCategories.map((category) => (
          <BuildingCategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  )
}
