'use client'

import { useMemo } from 'react'
import { ItemBadge } from './ItemBadge'

interface BaseMaterialsPanelV2Props {
  materialTotals: Map<string, number>
  totalSteps: number
  className?: string
}

export default function BaseMaterialsPanelV2({ 
  materialTotals,
  totalSteps,
  className
}: BaseMaterialsPanelV2Props) {
  // Convert Map to sorted array for consistent rendering - memoized to prevent loops
  const materials = useMemo(() => {
    return Array.from(materialTotals.entries())
      .sort(([aId], [bId]) => aId.localeCompare(bId)) // STRING SORT!
      .map(([materialId, materialQty]) => ({
        id: materialId,
        qty: materialQty
      }))
  }, [materialTotals])
  
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="text-sm text-muted-foreground">
        {materials.length} materials • {totalSteps} crafting steps
      </div>
      
      {/* Clean list using ItemBadge for all item details */}
      <div className="space-y-2">
        {materials.map(({ id, qty }) => (
          <ItemBadge key={id} id={id} qty={qty} />
        ))}
      </div>
    </div>
  )
}
