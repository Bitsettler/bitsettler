import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import cargoDescData from '@/data/global/cargo_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import Link from 'next/link'

// Transform the JSON data to match the type structure
type ItemDescWithSnakeCase = Omit<ItemDesc, 'compendiumEntry'> & { compendium_entry: boolean }
type CargoDescWithSnakeCase = Omit<CargoDesc, 'compendiumEntry'> & { compendium_entry: boolean }
type ResourceDescWithSnakeCase = Omit<ResourceDesc, 'compendiumEntry'> & { compendium_entry: boolean }

export default function CompendiumPage() {
  // Cast JSON data to handle snake_case vs camelCase mismatch
  const itemData = itemDescData as unknown as ItemDescWithSnakeCase[]
  const cargoData = cargoDescData as unknown as CargoDescWithSnakeCase[]
  const resourceData = resourceDescData as unknown as ResourceDescWithSnakeCase[]

  // Filter only compendium entries
  const items = itemData.filter((item) => item.compendium_entry)
  const cargo = cargoData.filter((cargo) => cargo.compendium_entry)
  const resources = resourceData.filter((resource) => resource.compendium_entry)

  // Extract unique categories
  const itemCategories = [...new Set(items.map((item) => item.tag))].filter(Boolean).sort()
  const cargoCategories = [...new Set(cargo.map((cargo) => cargo.tag))].filter(Boolean).sort()
  const resourceCategories = [...new Set(resources.map((resource) => resource.tag))].filter(Boolean).sort()

  // Calculate statistics
  const stats = {
    items: items.length,
    cargo: cargo.length,
    resources: resources.length,
    total: items.length + cargo.length + resources.length
  }

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  return (
    <Container>
      <div className="space-y-8 py-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold">Bitcraft Compendium</h1>
          <p className="text-muted-foreground text-lg">
            Explore all items, cargo, and resources in the world of Bitcraft
          </p>
        </div>

        {/* Items Section */}
        <Card>
          <CardHeader>
            <CardTitle>Items ({stats.items})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {itemCategories.map((category) => {
                const count = items.filter((item) => item.tag === category).length
                return (
                  <Link key={category} href={`/compendium/${createSlug(category)}`} className="block">
                    <Badge variant="outline" className="hover:bg-accent w-full justify-between p-2">
                      <span>{category}</span>
                      <span>{count}</span>
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Cargo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cargo ({stats.cargo})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {cargoCategories.map((category) => {
                const count = cargo.filter((item) => item.tag === category).length
                return (
                  <Link key={category} href={`/compendium/${createSlug(category)}`} className="block">
                    <Badge variant="outline" className="hover:bg-accent w-full justify-between p-2">
                      <span>{category}</span>
                      <span>{count}</span>
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resources Section */}
        <Card>
          <CardHeader>
            <CardTitle>Resources ({stats.resources})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {resourceCategories.map((category) => {
                const count = resources.filter((item) => item.tag === category).length
                return (
                  <Link key={category} href={`/compendium/${createSlug(category)}`} className="block">
                    <Badge variant="outline" className="hover:bg-accent w-full justify-between p-2">
                      <span>{category}</span>
                      <span>{count}</span>
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
