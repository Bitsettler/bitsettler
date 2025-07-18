import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export interface CategoryData {
  tag: string
  count: number
}

export interface CompendiumSection {
  title: string
  categories: CategoryData[]
  totalCount: number
}

export interface SpecialCollection {
  href: string
  icon: string
  title: string
  description: string
}

export interface CompendiumIndexPageViewProps {
  title: string
  subtitle: string
  specialCollections: SpecialCollection[]
  sections: CompendiumSection[]
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function CompendiumIndexPageView({
  title,
  subtitle,
  specialCollections,
  sections
}: CompendiumIndexPageViewProps) {
  return (
    <Container>
      <div className="space-y-12 py-8">
        {/* Hero Section */}
        <div className="space-y-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed">{subtitle}</p>
        </div>

        {/* Special Collections */}
        {specialCollections.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Featured Collections</h2>
              <p className="text-muted-foreground text-lg">
                Explore curated collections of the most important items in Bitcraft
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {specialCollections.map((collection) => (
                <Link key={collection.href} href={collection.href} className="group block">
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{collection.icon}</span>
                        <div>
                          <h3 className="group-hover:text-accent-foreground font-semibold">{collection.title}</h3>
                          <p className="text-muted-foreground text-sm">{collection.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse by Category */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Browse by Category</h2>
            <p className="text-muted-foreground text-lg">
              Find exactly what you're looking for with our organized category system
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-2xl font-semibold">
                  {section.title}
                  <span className="text-muted-foreground ml-2 text-lg font-normal">({section.totalCount} items)</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {section.categories.map((category) => (
                  <Card key={category.tag} className="hover:bg-accent/50 p-4 transition-colors">
                    <Link href={`/compendium/${createSlug(category.tag)}`} className="group block">
                      <div className="flex items-center justify-between">
                        <span className="group-hover:text-accent-foreground font-medium">{category.tag}</span>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </Container>
  )
}
