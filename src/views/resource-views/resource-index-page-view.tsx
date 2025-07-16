import { Container } from '@/components/container'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface ResourceCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
  category: string
  href: string
  primaryBiomes: readonly string[]
  resourceCategory: string
}

interface ResourceIndexPageViewProps {
  title: string
  subtitle: string
  resourceCategories: ResourceCategory[]
}

function ResourceCategoryCard({ category }: { category: ResourceCategory }) {
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
        <CardContent className="flex flex-1 flex-col justify-between space-y-3">
          <CardDescription className="line-clamp-3 text-sm">{category.description}</CardDescription>
          
          {/* Primary Biomes */}
          {category.primaryBiomes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Primary Biomes:</p>
              <div className="flex flex-wrap gap-1">
                {category.primaryBiomes.slice(0, 3).map((biome) => (
                  <Badge key={biome} variant="secondary" className="text-xs">
                    {biome}
                  </Badge>
                ))}
                {category.primaryBiomes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{category.primaryBiomes.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export function ResourceIndexPageView({ title, subtitle, resourceCategories }: ResourceIndexPageViewProps) {
  // Group categories by section
  const categoriesBySection = resourceCategories.reduce(
    (acc, category) => {
      if (!acc[category.category]) {
        acc[category.category] = []
      }
      acc[category.category].push(category)
      return acc
    },
    {} as Record<string, ResourceCategory[]>
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

        {/* Resource Categories by Section */}
        {Object.entries(categoriesBySection)
          .filter(([, categories]) => categories.length > 0) // Only show sections with categories
          .map(([sectionName, categories]) => (
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
                  <ResourceCategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          ))}

        {/* Empty State */}
        {resourceCategories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No resource categories found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  )
}