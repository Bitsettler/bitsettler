'use client'

import { Container } from '@/components/container'
import { SortableTableHeader } from '@/components/sortable-table-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Rarity } from '@/data/bindings/rarity_type'
import { Link } from '@/i18n/navigation'
import { cleanIconAssetName, getServerIconPath } from '@/lib/spacetime-db-new/shared/assets'
import { getTierColor } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getRarityColor } from '@/lib/spacetime-db-new/shared/utils/rarity'
import type { WeaponGroup } from '@/lib/spacetime-db-new/modules/weapons/flows'
import Image from 'next/image'
import { useMemo, useState } from 'react'

interface WeaponsViewProps {
  title: string
  subtitle: string
  weaponGroups: WeaponGroup[]
}

// Generic item interface for table rendering
interface WeaponItem {
  id: number
  name: string
  description?: string
  iconAssetName: string
  tier: number
  rarity: Rarity
  minDamage: number
  maxDamage: number
  cooldown: string
  staminaMultiplier: string
  weaponType: string
}

interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  className?: string
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

// Helper function to get nested property values
function getValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  return path.split('.').reduce((current: unknown, key) => {
    return current && typeof current === 'object' && key in current
      ? (current as Record<string, unknown>)[key]
      : undefined
  }, obj)
}

export function WeaponsView({ title, subtitle, weaponGroups }: WeaponsViewProps) {
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

  // Transform weapon groups into item groups with sorting
  const processedGroups = useMemo(() => {
    return weaponGroups.map((group) => {
      // Deduplicate weapons by name + tier combination
      const deduplicatedWeapons = group.weapons.reduce(
        (acc, weapon) => {
          const key = `${weapon.item.name}_T${weapon.item.tier}`
          if (!acc[key]) {
            acc[key] = weapon
          }
          return acc
        },
        {} as Record<string, (typeof group.weapons)[0]>
      )

      const weaponsList = Object.values(deduplicatedWeapons)

      // Transform to table items
      let items: WeaponItem[] = weaponsList.map((weapon) => ({
        ...weapon.item,
        minDamage: weapon.weaponData.minDamage,
        maxDamage: weapon.weaponData.maxDamage,
        cooldown: weapon.weaponData.cooldown.toFixed(2),
        staminaMultiplier: weapon.weaponData.staminaUseMultiplier.toFixed(2),
        weaponType: weapon.weaponType.name
      }))

      // Apply sorting
      const sortState = sortStates[group.weaponType]
      if (sortState) {
        items = [...items].sort((a, b) => {
          const aValue = getValue(a, sortState.key) as string | number
          const bValue = getValue(b, sortState.key) as string | number

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
            return sortState.direction === 'asc' ? comparison : -comparison
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            const comparison = aValue - bValue
            return sortState.direction === 'asc' ? comparison : -comparison
          } else {
            const comparison = String(aValue).localeCompare(String(bValue))
            return sortState.direction === 'asc' ? comparison : -comparison
          }
        })
      } else {
        // Default sort by tier ascending
        items = items.sort((a, b) => a.tier - b.tier)
      }

      const columns: TableColumn[] = [
        { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
        { key: 'minDamage', label: 'Min Damage', sortable: true, className: 'text-center' },
        { key: 'maxDamage', label: 'Max Damage', sortable: true, className: 'text-center' },
        { key: 'cooldown', label: 'Cooldown (s)', sortable: true, className: 'text-center' },
        { key: 'staminaMultiplier', label: 'Stamina Multiplier', sortable: true, className: 'text-center' }
      ]

      return {
        name: group.weaponType,
        subtitle: group.isHuntingType ? 'Hunting weapons' : 'Combat weapons',
        items,
        columns
      }
    })
  }, [weaponGroups, sortStates])

  // Default render functions for common column types
  const defaultRenders = {
    icon: (item: WeaponItem) => (
      <div className="bg-muted relative h-13 w-13 rounded p-1">
        <Image
          src={getServerIconPath(cleanIconAssetName(item.iconAssetName))}
          alt={item.name}
          fill
          className="object-contain"
        />
      </div>
    ),
    name: (item: WeaponItem) => (
      <div>
        <div className="font-medium">{item.name}</div>
      </div>
    ),
    tier: (item: WeaponItem) => (
      <Badge variant="outline" className={getTierColor(item.tier)}>
        T{item.tier}
      </Badge>
    ),
    rarity: (item: WeaponItem) => {
      const rarityTag = item.rarity.tag.toLowerCase()
      return (
        <Badge variant="outline" className={`capitalize ${getRarityColor(rarityTag)}`}>
          {item.rarity.tag}
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
              <Link href="/compendium">← Back to Compendium</Link>
            </Button>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Weapon Tables by Type */}
        <div className="space-y-6">
          {processedGroups.map((group) => (
            <Card key={group.name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div className="capitalize">{group.name}</div>
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
                        const itemLink = `/compendium/weapon/${itemSlug}`

                        return (
                          <TableRow key={item.id || index} className="hover:bg-muted/50 cursor-pointer">
                            {group.columns.map((column) => (
                              <TableCell key={column.key} className="p-0 text-center">
                                <Link
                                  href={itemLink}
                                  className="block h-full w-full p-2 text-inherit hover:text-inherit"
                                >
                                  {defaultRenders[column.key as keyof typeof defaultRenders]
                                    ? defaultRenders[column.key as keyof typeof defaultRenders](item)
                                    : String(getValue(item, column.key) || '')}
                                </Link>
                              </TableCell>
                            ))}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {weaponGroups.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No weapons found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  )
}
