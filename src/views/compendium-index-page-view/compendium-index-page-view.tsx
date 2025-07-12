import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="space-y-8 py-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        </div>

        {/* Special Collections */}
        {specialCollections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Special Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {specialCollections.map((collection) => (
                  <Link key={collection.href} href={collection.href} className="block">
                    <Badge variant="secondary" className="hover:bg-accent w-full justify-between p-3">
                      <span>{collection.icon} {collection.title}</span>
                      <span>{collection.description}</span>
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dynamic Sections */}
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title} ({section.totalCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {section.categories.map((category) => (
                  <Link 
                    key={category.tag} 
                    href={`/compendium/${createSlug(category.tag)}`} 
                    className="block"
                  >
                    <Badge variant="outline" className="hover:bg-accent w-full justify-between p-2">
                      <span>{category.tag}</span>
                      <span>{category.count}</span>
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  )
}