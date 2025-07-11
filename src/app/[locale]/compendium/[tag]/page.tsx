import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import cargoDescData from '@/data/global/cargo_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import { getRarityColor, getTierColor } from '@/lib/spacetime-db'
import { convertRarityToString } from '@/lib/spacetime-db/rarity'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type CompendiumEntity = ItemDesc | CargoDesc | ResourceDesc

interface PageProps {
  params: {
    tag: string
  }
}

export default function CompendiumCategoryPage({ params }: PageProps) {
  const { tag } = params

  // Convert slug back to tag name
  const tagName = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Convert snake_case JSON to camelCase and type properly
  const itemData = camelCaseDeep<ItemDesc[]>(itemDescData)
  const cargoData = camelCaseDeep<CargoDesc[]>(cargoDescData)
  const resourceData = camelCaseDeep<ResourceDesc[]>(resourceDescData)

  // Filter entries by tag
  const items = itemData.filter((item) => item.compendiumEntry && item.tag === tagName)
  const cargo = cargoData.filter((cargo) => cargo.tag === tagName)
  const resources = resourceData.filter((resource) => resource.compendiumEntry && resource.tag === tagName)

  // Combine all entities
  const allEntities: CompendiumEntity[] = [...items, ...cargo, ...resources]

  // If no entities found, return 404
  if (allEntities.length === 0) {
    notFound()
  }

  // Determine entity type
  const entityType = items.length > 0 ? 'Items' : cargo.length > 0 ? 'Cargo' : 'Resources'

  return (
    <Container>
      <div className="space-y-6 py-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/compendium">← Back to Compendium</Link>
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{tagName}</h1>
            <p className="text-muted-foreground">
              {allEntities.length} {entityType.toLowerCase()} in this category
            </p>
          </div>
        </div>

        {/* Entities Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {tagName} ({allEntities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Icon</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left">Tier</th>
                    <th className="p-2 text-left">Rarity</th>
                    <th className="p-2 text-left">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {allEntities.map((entity) => {
                    const rarityString = convertRarityToString(entity.rarity)
                    return (
                      <tr key={entity.id} className="hover:bg-accent/50 border-b">
                        <td className="p-2">
                          <div className="relative h-8 w-8">
                            <Image
                              src={
                                entity.iconAssetName
                                  ? `/assets/${
                                      entity.iconAssetName.startsWith('GeneratedIcons/')
                                        ? entity.iconAssetName
                                        : `GeneratedIcons/${entity.iconAssetName}`
                                    }.webp`
                                  : '/assets/Unknown.webp'
                              }
                              alt={entity.name}
                              fill
                              className="object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/Unknown.webp'
                              }}
                            />
                          </div>
                        </td>
                        <td className="p-2 font-medium">{entity.name}</td>
                        <td className="text-muted-foreground max-w-xs truncate p-2 text-sm">
                          {entity.description || 'No description'}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className={getTierColor(entity.tier)}>
                            T{entity.tier}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className={getRarityColor(rarityString)}>
                            {rarityString.charAt(0).toUpperCase() + rarityString.slice(1)}
                          </Badge>
                        </td>
                        <td className="text-muted-foreground p-2 font-mono text-sm">{entity.id}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
