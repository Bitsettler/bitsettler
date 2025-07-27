import { Container } from '@/components/container'
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

interface BuildingCategory {
  id: string
  name: string
  description: string
  icon: string | undefined
  count: number
  href: string
  category: string
}

interface BuildingsViewProps {
  title: string
  subtitle: string
  buildingCategories: BuildingCategory[]
}

function BuildingCategoryCard({ category }: { category: BuildingCategory }) {
  return (
    <Link href={category.href} className="block h-full">
      <Card className="group flex h-full flex-col transition-all hover:scale-[1.02] hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-lg">
                {/* <span className="text-2xl">{category.icon}</span> */}
                <Image
                  src={getServerIconPath(cleanIconAssetName(category.icon))}
                  alt={category.name}
                  width={52}
                  height={52}
                />
              </div>
              <div>
                <CardTitle className="group-hover:text-primary text-lg transition-colors">
                  {category.name}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {category.count} buildings
                </p>
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

export function BuildingsView({
  title,
  subtitle,
  buildingCategories
}: BuildingsViewProps) {
  return (
    <Container>
      <div className="space-y-8 py-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        </div>

        {/* Categories Grid */}
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {buildingCategories.map((category) => (
            <BuildingCategoryCard key={category.id} category={category} />
          ))}
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            🔍 Click on any category to explore buildings, construction
            requirements, and detailed specifications!
          </p>
        </div>
      </div>
    </Container>
  )
}
