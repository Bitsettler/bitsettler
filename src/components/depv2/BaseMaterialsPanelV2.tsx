'use client'

import { useMemo } from 'react'
import { expandToBase } from '@/lib/depv2/engine'
import { ItemBadge } from './ItemBadge'

interface BaseMaterialsPanelV2Props {
  itemId: number
  qty?: number
}

export default function BaseMaterialsPanelV2({ 
  itemId, 
  qty = 1 
}: BaseMaterialsPanelV2Props) {
  const result = useMemo(() => expandToBase(itemId, qty), [itemId, qty])
  
  // Convert Map to sorted array for consistent rendering - memoized to prevent loops
  const materials = useMemo(() => {
    return Array.from(result.totals.entries())
      .sort(([aId], [bId]) => aId - bId)
      .map(([materialId, materialQty]) => ({
        id: materialId,
        qty: materialQty
      }))
  }, [result.totals])
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {materials.length} materials • {result.steps} crafting steps
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
