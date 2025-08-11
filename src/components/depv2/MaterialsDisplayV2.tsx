'use client'

import { useMemo } from 'react'
import { getItemDisplay } from '@/lib/depv2/display'
import { ItemBadge } from './ItemBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'

interface MaterialsDisplayV2Props {
  materialTotals: Map<string, number>
  totalSteps: number
  groupBySkill?: boolean
  useTableView?: boolean
  className?: string
}

interface MaterialWithSkill {
  id: string
  qty: number
  skill: string | undefined
  name: string
  tier?: number
}

export function MaterialsDisplayV2({ 
  materialTotals,
  totalSteps,
  groupBySkill = false,
  useTableView = false,
  className
}: MaterialsDisplayV2Props) {
  // Convert materials to enriched format with skill data
  const materialsWithSkills = useMemo(() => {
    return Array.from(materialTotals.entries())
      .map(([materialId, materialQty]) => {
        const display = getItemDisplay(materialId)
        return {
          id: materialId,
          qty: materialQty,
          skill: display.skill,
          name: display.name,
          tier: display.tier
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [materialTotals])

  // Group materials by skill if requested
  const groupedMaterials = useMemo(() => {
    if (!groupBySkill) {
      return { 'All Materials': materialsWithSkills }
    }

    const groups: Record<string, MaterialWithSkill[]> = {}
    
    materialsWithSkills.forEach(material => {
      const skillName = material.skill || 'Unknown Skill'
      if (!groups[skillName]) {
        groups[skillName] = []
      }
      groups[skillName].push(material)
    })

    // Sort groups by skill name
    const sortedGroups: Record<string, MaterialWithSkill[]> = {}
    Object.keys(groups)
      .sort()
      .forEach(skill => {
        sortedGroups[skill] = groups[skill]
      })

    return sortedGroups
  }, [materialsWithSkills, groupBySkill])

  // Render table view
  const renderTableView = () => (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        {materialsWithSkills.length} materials • {totalSteps} crafting steps
      </div>
      
      {Object.entries(groupedMaterials).map(([skillName, materials]) => (
        <Card key={skillName} className="overflow-hidden">
          {groupBySkill && (
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {skillName}
                <Badge variant="secondary" className="text-xs">
                  {materials.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className={groupBySkill ? "pt-0" : ""}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right w-24">Amount</TableHead>
                  {!groupBySkill && <TableHead className="w-20">Skill</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 flex-shrink-0 rounded-md bg-muted p-1 border">
                          <img 
                            src={getItemDisplay(material.id).icon} 
                            alt={material.name}
                            className="w-full h-full object-contain rounded-md" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/assets/Unknown.webp'
                            }}
                          />
                          {material.tier && material.tier > 0 && (
                            <div className="absolute -top-1 -right-1">
                              <img
                                className="size-3"
                                src={`/assets/Badges/badge-tier-number-${Math.max(1, Math.min(10, material.tier))}.webp`}
                                alt={`Tier ${material.tier}`}
                                style={{
                                  mask: 'url("/assets/Badges/badge-tier-container.webp") 0% 0% / contain'
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{material.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {material.qty.toLocaleString()}
                    </TableCell>
                    {!groupBySkill && (
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {material.skill || 'Unknown'}
                        </Badge>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Render list view
  const renderListView = () => (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        {materialsWithSkills.length} materials • {totalSteps} crafting steps
      </div>
      
      {Object.entries(groupedMaterials).map(([skillName, materials]) => (
        <div key={skillName} className="space-y-3">
          {groupBySkill && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <h3 className="font-medium">{skillName}</h3>
              <Badge variant="secondary" className="text-xs">
                {materials.length} items
              </Badge>
            </div>
          )}
          <div className="space-y-2">
            {materials.map((material) => (
              <ItemBadge key={material.id} id={material.id} qty={material.qty} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {useTableView ? renderTableView() : renderListView()}
    </div>
  )
}
