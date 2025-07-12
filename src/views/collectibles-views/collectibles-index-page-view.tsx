'use client'

import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'

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

  const CategorySection = ({ sectionTitle, categories }: { sectionTitle: string; categories: CollectibleCategory[] }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{sectionTitle}</h2>
        <Badge variant="secondary">{categories.length} types</Badge>
      </div>
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={category.href} className="block h-full">
            <Card className="group flex h-full flex-col transition-all hover:scale-[1.02] hover:shadow-md">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-primary text-lg transition-colors">
                        {category.name}
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

        {/* Statistics Overview */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{collectibleCategories.length}</div>
              <p className="text-muted-foreground text-xs">Category Types</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{collectibleCategories.reduce((sum, cat) => sum + cat.count, 0)}</div>
              <p className="text-muted-foreground text-xs">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {Object.keys(categoriesBySection).length}
              </div>
              <p className="text-muted-foreground text-xs">Sections</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {collectibleCategories.filter(cat => cat.category === 'Property & Ownership').length}
              </div>
              <p className="text-muted-foreground text-xs">Property Types</p>
            </CardContent>
          </Card>
        </div>

        {/* Collectible Categories by Section */}
        <div className="space-y-8">
          {Object.entries(categoriesBySection).map(([sectionName, categories]) => (
            <CategorySection key={sectionName} sectionTitle={sectionName} categories={categories} />
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