'use client'

import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import type { ToolCategory } from '@/lib/spacetime-db-new/modules/tools/flows'
import { cleanIconAssetName, getServerIconPath } from '@/lib/spacetime-db/shared/assets'
import Image from 'next/image'

interface ToolsViewProps {
  title: string
  subtitle: string
  toolCategories: ToolCategory[]
}

export function ToolsView({ title, subtitle, toolCategories }: ToolsViewProps) {
  // Group categories by type
  const gatheringTools = toolCategories.filter((cat) => cat.category === 'Gathering')
  const craftingTools = toolCategories.filter((cat) => cat.category === 'Crafting')

  const CategorySection = ({ sectionTitle, categories }: { sectionTitle: string; categories: ToolCategory[] }) => (
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
                    <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-lg">
                      {category.firstTool ? (
                        <Image
                          src={getServerIconPath(cleanIconAssetName(category.firstTool.iconAssetName))}
                          alt={category.firstTool.name}
                          width={44}
                          height={44}
                          className="rounded"
                        />
                      ) : (
                        <span className="text-2xl">🔧</span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-primary text-lg transition-colors">
                        {category.name}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">{category.count} tools</p>
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

        {/* Tool Categories */}
        <div className="space-y-8">
          <CategorySection sectionTitle="Gathering Tools" categories={gatheringTools} />
          <CategorySection sectionTitle="Crafting Tools" categories={craftingTools} />
        </div>
      </div>
    </Container>
  )
}
