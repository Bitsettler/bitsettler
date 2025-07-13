'use client'

import { Container } from '@/components/container'
import { SortableTableHeader } from '@/components/sortable-table-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getTierColor } from '@/lib/spacetime-db'
import { cleanIconAssetName, getServerIconPath } from '@/lib/spacetime-db/assets'
import { type WeaponWithItem } from '@/lib/spacetime-db/weapons'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

interface WeaponsViewProps {
  title: string
  subtitle: string
  weaponsByType: Record<string, WeaponWithItem[]>
}

export function WeaponsView({ title, subtitle, weaponsByType }: WeaponsViewProps) {
  // Sorting state for each weapon type
  const [sortStates, setSortStates] = useState<Record<string, { key: string; direction: 'asc' | 'desc' } | null>>({})

  // Function to handle sorting for a specific weapon type
  const handleSort = (weaponType: string, sortKey: string) => {
    setSortStates((prev) => {
      const currentSort = prev[weaponType]
      const newDirection = currentSort?.key === sortKey && currentSort.direction === 'asc' ? 'desc' : 'asc'

      return {
        ...prev,
        [weaponType]: { key: sortKey, direction: newDirection }
      }
    })
  }

  // Sort and deduplicate weapons by type with current sort state
  const sortedWeaponsByType = useMemo(() => {
    const result: Record<string, WeaponWithItem[]> = {}

    Object.entries(weaponsByType).forEach(([weaponType, weapons]) => {
      // First, deduplicate weapons by tier (keep only one weapon per tier)
      const deduplicatedWeapons = weapons.reduce(
        (acc, weapon) => {
          const key = `${weapon.item.name}_T${weapon.tier}`
          // If we haven't seen this weapon name + tier combination, or if this one has a higher rarity, keep it
          if (!acc[key]) {
            acc[key] = weapon
          }
          return acc
        },
        {} as Record<string, WeaponWithItem>
      )

      const weaponsList = Object.values(deduplicatedWeapons)
      const sortState = sortStates[weaponType]

      if (!sortState) {
        // Default sort by tier ascending
        result[weaponType] = weaponsList.sort((a, b) => a.tier - b.tier)
      } else {
        result[weaponType] = weaponsList.sort((a, b) => {
          let aValue: string | number
          let bValue: string | number

          switch (sortState.key) {
            case 'name':
              aValue = a.item.name.toLowerCase()
              bValue = b.item.name.toLowerCase()
              break
            case 'tier':
              aValue = a.tier
              bValue = b.tier
              break
            case 'minDamage':
              aValue = a.minDamage
              bValue = b.minDamage
              break
            case 'maxDamage':
              aValue = a.maxDamage
              bValue = b.maxDamage
              break
            case 'cooldown':
              aValue = a.cooldown
              bValue = b.cooldown
              break
            case 'staminaMultiplier':
              aValue = a.staminaUseMultiplier
              bValue = b.staminaUseMultiplier
              break
            default:
              aValue = a.tier
              bValue = b.tier
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
      }
    })

    return result
  }, [weaponsByType, sortStates])

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
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Weapons by Type */}
        <div className="space-y-6">
          {Object.entries(sortedWeaponsByType).map(([weaponType, weapons]) => (
            <Card key={weaponType}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{weaponType}</span>
                  <Badge variant="secondary">{weapons.length} weapons</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Icon</TableHead>
                        <SortableTableHeader
                          sortKey="name"
                          currentSort={sortStates[weaponType]}
                          onSort={(key) => handleSort(weaponType, key)}
                          className="hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                          Name
                        </SortableTableHeader>
                        <SortableTableHeader
                          sortKey="tier"
                          currentSort={sortStates[weaponType]}
                          onSort={(key) => handleSort(weaponType, key)}
                        >
                          Tier
                        </SortableTableHeader>
                        <SortableTableHeader
                          sortKey="minDamage"
                          currentSort={sortStates[weaponType]}
                          onSort={(key) => handleSort(weaponType, key)}
                        >
                          Min Damage
                        </SortableTableHeader>
                        <SortableTableHeader
                          sortKey="maxDamage"
                          currentSort={sortStates[weaponType]}
                          onSort={(key) => handleSort(weaponType, key)}
                        >
                          Max Damage
                        </SortableTableHeader>
                        <SortableTableHeader
                          sortKey="cooldown"
                          currentSort={sortStates[weaponType]}
                          onSort={(key) => handleSort(weaponType, key)}
                        >
                          Cooldown
                        </SortableTableHeader>
                        <SortableTableHeader
                          sortKey="staminaMultiplier"
                          currentSort={sortStates[weaponType]}
                          onSort={(key) => handleSort(weaponType, key)}
                        >
                          Stamina Multiplier
                        </SortableTableHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weapons.map((weapon) => (
                        <TableRow key={weapon.item.id}>
                          <TableCell>
                            <div className="relative h-10 w-10">
                              <Image
                                src={getServerIconPath(cleanIconAssetName(weapon.item.iconAssetName))}
                                alt={weapon.item.name}
                                fill
                                className="object-contain"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <div>{weapon.item.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={getTierColor(weapon.tier)}>
                              T{weapon.tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono">{weapon.minDamage}</TableCell>
                          <TableCell className="text-center font-mono">{weapon.maxDamage}</TableCell>
                          <TableCell className="text-center font-mono">{weapon.cooldown}s</TableCell>
                          <TableCell className="text-center font-mono">{weapon.staminaUseMultiplier}x</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {Object.keys(sortedWeaponsByType).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No weapons found in the database.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  )
}
