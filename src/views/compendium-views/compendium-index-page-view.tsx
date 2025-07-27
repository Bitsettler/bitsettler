import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import {
  cleanIconAssetName,
  getServerIconPath
} from '@/lib/spacetime-db-new/shared/assets'
import Image from 'next/image'
import Link from 'next/link'

export interface CategoryData {
  id: string
  name: string
  count: number
  icon?: string
  description: string
  href: string
  section: string
}

export interface CompendiumSection {
  title: string
  categories: CategoryData[]
  totalCount: number
}

export interface SpecialCollection {
  href: string
  icon?: string // Now optional iconAssetName instead of emoji
  title: string
  description: string
}

export interface CompendiumIndexPageViewProps {
  title: string
  subtitle: string
  specialCollections: SpecialCollection[]
  sections: CompendiumSection[]
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
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Special Collections */}
        {specialCollections.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">
                Featured Collections
              </h2>
              <p className="text-muted-foreground text-lg">
                Explore curated collections of the most important items in
                Bitcraft
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {specialCollections.map((collection) => (
                <li key={collection.href}>
                  <Link href={collection.href} className="group block">
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardTitle className="px-6">
                        <div className="flex items-center gap-3">
                          {collection.icon ? (
                            <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-lg">
                              <Image
                                src={getServerIconPath(
                                  cleanIconAssetName(collection.icon)
                                )}
                                alt={collection.title}
                                width={44}
                                height={44}
                                className="rounded"
                              />
                            </div>
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                          <div>
                            <h3 className="group-hover:text-accent-foreground font-semibold">
                              {collection.title}
                            </h3>
                          </div>
                        </div>
                      </CardTitle>
                      <CardContent className="">
                        <p className="text-muted-foreground text-sm">
                          {collection.description}
                        </p>
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
            <h2 className="text-3xl font-semibold tracking-tight">
              Browse by Category
            </h2>
            <p className="text-muted-foreground text-lg">
              Find exactly what you&apos;re looking for with our organized
              category system
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-2xl font-semibold">
                  {section.title}
                  <span className="text-muted-foreground ml-2 text-lg font-normal">
                    ({section.totalCount} items)
                  </span>
                </h3>
              </div>

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5">
                {section.categories.map((category) => (
                  <li key={category.id} className="h-full">
                    <Card className="hover:bg-accent/50 h-full p-0 transition-colors">
                      <Link href={category.href} className="group h-full p-4">
                        <div className="flex items-center space-x-3">
                          {category.icon && (
                            <div className="flex-shrink-0">
                              <Image
                                src={getServerIconPath(
                                  cleanIconAssetName(category.icon)
                                )}
                                alt={category.name}
                                width={36}
                                height={36}
                                className="rounded"
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-1">
                            <div className="group-hover:text-accent-foreground text-sm font-medium">
                              {category.name}
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-muted-foreground text-xs"
                            >
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
