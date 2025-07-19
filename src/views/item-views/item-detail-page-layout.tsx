'use client'

import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { Link, usePathname } from '@/i18n/navigation'
import { createSlug } from '@/lib/spacetime-db/shared/utils/entities'
import { cleanIconAssetName, getServerIconPath } from '@/lib/spacetime-db/shared/assets'
import { convertRarityToString, getRarityColor } from '@/lib/spacetime-db/shared/utils/rarity'
import { ArrowLeft, Calculator, Package, Sparkles, Star } from 'lucide-react'
import Image from 'next/image'

interface ItemDetailPageLayoutProps {
  item: ItemDesc
  children: React.ReactNode
}

export function ItemDetailPageLayout({ item, children }: ItemDetailPageLayoutProps) {
  const pathname = usePathname()
  const rarityString = convertRarityToString(item.rarity)
  const rarityColor = getRarityColor(rarityString)
  const iconPath = getServerIconPath(cleanIconAssetName(item.iconAssetName))
  const itemSlug = createSlug(item.name)
  const tagSlug = item.tag.toLowerCase().replace(/\s+/g, '-')
  const baseUrl = `/compendium/${tagSlug}/${itemSlug}`

  // Tab configuration
  const tabs = [
    { id: 'info', label: 'Info', href: baseUrl },
    { id: 'obtain', label: 'Obtain', href: `${baseUrl}/obtain` },
    { id: 'used-in', label: 'Used In', href: `${baseUrl}/used-in` },
    { id: 'construction', label: 'Construction', href: `${baseUrl}/construction` },
    { id: 'achievements', label: 'Achievements', href: `${baseUrl}/achievements` }
  ]

  // Determine active tab based on pathname
  const activeTab = tabs.find((tab) => pathname === tab.href) || tabs[0]

  return (
    <div className="bg-background min-h-screen">
      <Container className="py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href={`/compendium/${tagSlug}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {item.tag}
            </Button>
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Item Icon */}
            <div className="flex-shrink-0">
              <div className="border-border bg-muted relative h-24 w-24 overflow-hidden rounded-lg border-2 md:h-32 md:w-32">
                <Image
                  src={iconPath}
                  alt={item.name}
                  fill
                  className="object-contain p-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/assets/Unknown.webp'
                  }}
                />
              </div>
            </div>

            {/* Item Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-foreground text-4xl font-bold">{item.name}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3" />
                    Tier {item.tier}
                  </Badge>
                  <Badge variant="outline" className={`gap-1 ${rarityColor}`}>
                    <Sparkles className="h-3 w-3" />
                    {rarityString.charAt(0).toUpperCase() + rarityString.slice(1)}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Package className="h-3 w-3" />
                    {item.tag}
                  </Badge>
                </div>

                {/* Calculator Link */}
                <div className="mt-4">
                  <Button className="gap-2" asChild>
                    <Link href={`/calculator/${itemSlug}`} target="_blank">
                      <Calculator className="h-4 w-4" />
                      View in Calculator
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-border mt-8 border-b">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`hover:text-foreground border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab.id === tab.id
                      ? 'border-primary text-primary'
                      : 'text-muted-foreground hover:border-muted-foreground border-transparent'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Content */}
          <div className="lg:col-span-9">{children}</div>

          {/* Sidebar */}
          <div className="lg:col-span-3">
            {/* Navigation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href={`/compendium/${tagSlug}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="mr-2 h-4 w-4" />
                      View all {item.tag}
                    </Button>
                  </Link>
                  <Link href="/compendium" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Browse Compendium
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  )
}
