import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

export interface CategoryData {
  tag: string
  count: number
  firstItem?: {
    name: string
    icon_asset_name: string
  }
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

function getCompendiumPath(sectionTitle: string, categoryTag: string): string {
  const slug = createSlug(categoryTag)
  switch (sectionTitle) {
    case 'Cargo':
      return `/compendium/cargo/${slug}`
    case 'Resources':
      return `/compendium/resources/${slug}`
    case 'Items':
    default:
      return `/compendium/${slug}`
  }
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

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {specialCollections.map((collection) => (
                <li key={collection.href}>
                  <Link href={collection.href} className="group block">
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardTitle className="px-6">
                        <span className="text-2xl">{collection.icon}</span>
                        <div>
                          <h3 className="group-hover:text-accent-foreground font-semibold">{collection.title}</h3>
                        </div>
                      </CardTitle>
                      <CardContent className="">
                        <p className="text-muted-foreground text-sm">{collection.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Browse by Category */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Browse by Category</h2>
            <p className="text-muted-foreground text-lg">
              Find exactly what you&apos;re looking for with our organized category system
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

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5">
                {section.categories.map((category) => (
                  <li key={category.tag} className="h-full">
                    <Card className="hover:bg-accent/50 h-full p-0 transition-colors">
                      <Link href={getCompendiumPath(section.title, category.tag)} className="group h-full p-4">
                        <div className="flex items-center space-x-3">
                          {category.firstItem && (
                            <div className="flex-shrink-0">
                              <Image
                                src={category.firstItem.icon_asset_name || '/assets/Unknown.webp'}
                                alt={category.firstItem.name}
                                width={36}
                                height={36}
                                className="rounded"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-1">
                            <div className="group-hover:text-accent-foreground text-sm font-medium">{category.tag}</div>
                            <Badge variant="secondary" className="text-muted-foreground text-xs">
                              {category.count}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </Container>
  )
}
