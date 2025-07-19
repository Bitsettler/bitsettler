'use client'

import { Container } from '@/components/container'
import { SortableTableHeader } from '@/components/sortable-table-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Rarity } from '@/data/bindings/rarity_type'
import { convertRarityToString, getRarityColor } from '@/lib/spacetime-db/shared/utils/rarity'
import { getTierColor } from '@/lib/spacetime-db/shared/utils/entities'
import { cleanIconAssetName, getServerIconPath } from '@/lib/spacetime-db/shared/assets'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useMemo, useState } from 'react'

// Generic interfaces for the data
export interface BaseItem {
  id: number
  name: string
  description?: string
  iconAssetName: string
  tier: number
  rarity: Rarity
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  className?: string
  render?: (item: BaseItem) => React.ReactNode
}

export interface ItemGroup {
  name: string
  subtitle?: string
  items: BaseItem[]
  columns: TableColumn[]
}

export interface TagPageViewProps {
  title: string
  subtitle: string
  backLink?: string
  backLinkText?: string
  itemGroups: ItemGroup[]
  enableItemLinks?: boolean
  tagSlug?: string
}

// Convert item name to URL slug
function itemNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

export function TagPageView({
  title,
  subtitle,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium',
  itemGroups,
  enableItemLinks = false,
  tagSlug
}: TagPageViewProps) {
  // Sorting state for each group
  const [sortStates, setSortStates] = useState<Record<string, { key: string; direction: 'asc' | 'desc' } | null>>({})

  // Function to handle sorting for a specific group
  const handleSort = (groupName: string, sortKey: string) => {
    setSortStates((prev) => {
      const currentSort = prev[groupName]
      const newDirection = currentSort?.key === sortKey && currentSort.direction === 'asc' ? 'desc' : 'asc'

      return {
        ...prev,
        [groupName]: { key: sortKey, direction: newDirection }
      }
    })
  }

  // Sort items by group with current sort state
  const sortedItemGroups = useMemo(() => {
    return itemGroups.map((group) => {
      const sortState = sortStates[group.name]

      if (!sortState) {
        // Default sort by tier ascending
        return {
          ...group,
          items: [...group.items].sort((a, b) => {
            const aTier = typeof a === 'object' && a && 'tier' in a ? (a as { tier: number }).tier : 0
            const bTier = typeof b === 'object' && b && 'tier' in b ? (b as { tier: number }).tier : 0
            return aTier - bTier
          })
        }
      }

      const sortedItems = [...group.items].sort((a, b) => {
        let aValue: string | number = ''
        let bValue: string | number = ''

        // Handle nested properties with dot notation
        const getValue = (obj: unknown, path: string): unknown => {
          if (!obj || typeof obj !== 'object') return undefined
          return path.split('.').reduce((current: unknown, key) => {
            return current && typeof current === 'object' && key in current
              ? (current as Record<string, unknown>)[key]
              : undefined
          }, obj)
        }

        aValue = getValue(a, sortState.key) as string | number
        bValue = getValue(b, sortState.key) as string | number

        // Handle special cases
        if (sortState.key === 'rarity' || sortState.key.includes('rarity')) {
          // Convert the rarity value properly - it might be a Rarity object or need conversion
          const aRarity =
            typeof aValue === 'object' && aValue && 'tag' in aValue ? (aValue as Rarity) : ({ tag: 'Common' } as Rarity)
          const bRarity =
            typeof bValue === 'object' && bValue && 'tag' in bValue ? (bValue as Rarity) : ({ tag: 'Common' } as Rarity)
          aValue = convertRarityToString(aRarity)
          bValue = convertRarityToString(bRarity)
        } else if (sortState.key === 'name' || sortState.key.includes('name')) {
          aValue = String(aValue).toLowerCase()
          bValue = String(bValue).toLowerCase()
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue)
          return sortState.direction === 'asc' ? comparison : -comparison
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue
          return sortState.direction === 'asc' ? comparison : -comparison
        } else {
          // Fallback: convert to strings and compare
          const comparison = String(aValue).localeCompare(String(bValue))
          return sortState.direction === 'asc' ? comparison : -comparison
        }
      })

      return {
        ...group,
        items: sortedItems
      }
    })
  }, [itemGroups, sortStates])

  // Default render functions for common column types
  const defaultRenders = {
    icon: (item: BaseItem) => (
      <div className="relative h-10 w-10">
        {/* <span>{getServerIconPath(cleanIconAssetName(item.iconAssetName))}</span> */}
        <Image
          src={getServerIconPath(cleanIconAssetName(item.iconAssetName))}
          alt={item.name}
          fill
          className="object-contain"
        />
      </div>
    ),
    name: (item: BaseItem) => (
      <div>
        <div className="font-medium">{item.name}</div>
      </div>
    ),
    tier: (item: BaseItem) => (
      <Badge variant="outline" className={getTierColor(item.tier)}>
        T{item.tier}
      </Badge>
    ),
    rarity: (item: BaseItem) => {
      const rarityString = convertRarityToString(item.rarity)
      return (
        <Badge variant="outline" className={getRarityColor(rarityString)}>
          {rarityString.charAt(0).toUpperCase() + rarityString.slice(1)}
        </Badge>
      )
    }
  }

  return (
    <Container>
      <div className="space-y-6 py-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={backLink}>{backLinkText}</Link>
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Item Groups */}
        <div className="space-y-6">
          {sortedItemGroups.map((group) => (
            <Card key={group.name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div>{group.name}</div>
                    {group.subtitle && (
                      <div className="text-muted-foreground mt-1 text-sm font-normal">{group.subtitle}</div>
                    )}
                  </div>
                  <Badge variant="secondary">{group.items.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {group.columns.map((column) =>
                          column.sortable !== false ? (
                            <SortableTableHeader
                              key={column.key}
                              sortKey={column.key}
                              currentSort={sortStates[group.name]}
                              onSort={(key) => handleSort(group.name, key)}
                              className={
                                column.className || 'hover:bg-accent/50 cursor-pointer text-center transition-colors'
                              }
                            >
                              {column.label}
                            </SortableTableHeader>
                          ) : (
                            <TableHead key={column.key} className={column.className || 'text-center'}>
                              {column.label}
                            </TableHead>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((item, index) => {
                        const itemSlug = itemNameToSlug(item.name)
                        const itemLink = enableItemLinks && tagSlug ? `/compendium/${tagSlug}/${itemSlug}` : undefined
                        
                        if (itemLink) {
                          return (
                            <TableRow key={item.id || index} className="hover:bg-muted/50 cursor-pointer">
                              {group.columns.map((column) => (
                                <TableCell key={column.key} className="text-center p-0">
                                  <Link href={itemLink} className="block w-full h-full p-2 text-inherit hover:text-inherit">
                                    {column.render
                                      ? column.render(item)
                                      : defaultRenders[column.key as keyof typeof defaultRenders]
                                        ? defaultRenders[column.key as keyof typeof defaultRenders](item)
                                        : String(getValue(item, column.key) || '')}
                                  </Link>
                                </TableCell>
                              ))}
                            </TableRow>
                          )
                        } else {
                          return (
                            <TableRow key={item.id || index}>
                              {group.columns.map((column) => (
                                <TableCell key={column.key} className="text-center">
                                  {column.render
                                    ? column.render(item)
                                    : defaultRenders[column.key as keyof typeof defaultRenders]
                                      ? defaultRenders[column.key as keyof typeof defaultRenders](item)
                                      : String(getValue(item, column.key) || '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          )
                        }
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sortedItemGroups.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No items found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  )
}

// Helper function to get nested property values
function getValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  return path.split('.').reduce((current: unknown, key) => {
    return current && typeof current === 'object' && key in current
      ? (current as Record<string, unknown>)[key]
      : undefined
  }, obj)
}
