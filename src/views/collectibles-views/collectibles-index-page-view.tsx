'use client'

import { Container } from '@/components/container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { cleanIconAssetName, getServerIconPath } from '@/lib/spacetime-db-new/shared/assets'
import { camelCaseToSpaces } from '@/lib/utils'
import Image from 'next/image'

interface CollectibleCategory {
  id: string
  name: string
  description: string
  icon: string
  category: string
  href: string
  count: number
}

interface CollectiblesViewProps {
  title: string
  subtitle: string
  collectibleCategories: CollectibleCategory[]
}

export function CollectiblesView({ title, subtitle, collectibleCategories }: CollectiblesViewProps) {
  // Group categories by section
  const categoriesBySection = collectibleCategories.reduce(
    (acc, category) => {
      if (!acc[category.category]) {
        acc[category.category] = []
      }
      acc[category.category].push(category)
      return acc
    },
    {} as Record<string, CollectibleCategory[]>
  )

  const CategorySection = ({ categories }: { categories: CollectibleCategory[] }) => (
    <div className="space-y-4">
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={category.href} className="block h-full">
            <Card className="group flex h-full flex-col transition-all hover:scale-[1.02] hover:shadow-md">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-lg">
                      <Image
                        src={getServerIconPath(cleanIconAssetName(category.icon))}
                        alt={category.name}
                        width={52}
                        height={52}
                      />
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-primary text-lg transition-colors">
                        {camelCaseToSpaces(category.name)}
                      </CardTitle>
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
        ))}
      </div>
    </div>
  )

  return (
    <Container>
      <div className="space-y-8 py-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/compendium">← Back to Compendium</Link>
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Collectible Categories by Section */}
        <div className="space-y-8">
          {Object.entries(categoriesBySection).map(([sectionName, categories]) => (
            <CategorySection key={sectionName} categories={categories} />
          ))}
        </div>

        {/* Empty State */}
        {collectibleCategories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No collectible categories found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  )
}
