'use client'

import { Container } from '@/components/container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { EquipmentCategory } from '@/lib/spacetime-db-new/modules/equipment/flows'
import { cleanIconAssetName, getServerIconPath } from '@/lib/spacetime-db/shared/assets'
import Image from 'next/image'

interface EquipmentViewProps {
  title: string
  subtitle: string
  equipmentCategories: EquipmentCategory[]
}

function EquipmentCategoryCard({ category }: { category: EquipmentCategory }) {
  return (
    <Link href={category.href} className="block h-full">
      <Card className="group flex h-full flex-col transition-all hover:scale-[1.02] hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
                {category.firstEquipment ? (
                  <Image
                    src={getServerIconPath(cleanIconAssetName(category.firstEquipment.iconAssetName))}
                    alt={category.firstEquipment.name}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                ) : (
                  <span className="text-2xl">⚔️</span>
                )}
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

export function EquipmentView({ title, subtitle, equipmentCategories }: EquipmentViewProps) {
  // Group categories by section
  const categoriesBySection = equipmentCategories.reduce(
    (acc, category) => {
      if (!acc[category.category]) {
        acc[category.category] = []
      }
      acc[category.category].push(category)
      return acc
    },
    {} as Record<string, EquipmentCategory[]>
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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Equipment Categories by Section */}
        {Object.entries(categoriesBySection).map(([sectionName, categories]) => (
          <div key={sectionName} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{sectionName}</h2>
              <p className="text-muted-foreground">
                {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} with{' '}
                {categories.reduce((total, cat) => total + cat.count, 0)} total items
              </p>
            </div>
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <EquipmentCategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {equipmentCategories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No equipment categories found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  )
}
