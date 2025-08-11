'use client'

import { expandToBase } from '@/lib/depv2/engine'
import { getItemById } from '@/lib/depv2/indexes'
import { Badge } from '@/components/ui/badge'

interface BaseMaterialsPanelV2Props {
  itemId: number
  qty?: number
}

export default function BaseMaterialsPanelV2({ 
  itemId, 
  qty = 1 
}: BaseMaterialsPanelV2Props) {
  const result = expandToBase(itemId, qty)
  const itemById = getItemById()
  
  // Convert Map to sorted array for consistent rendering
  const materials = Array.from(result.totals.entries())
    .sort(([aId], [bId]) => aId - bId)
    .map(([materialId, materialQty]) => ({
      id: materialId,
      qty: materialQty,
      item: itemById.get(materialId)
    }))
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {materials.length} materials • {result.steps} crafting steps
      </div>
      
      <div className="flex flex-wrap gap-2">
        {materials.map(({ id, qty, item }) => (
          <Badge key={id} variant="secondary" className="text-sm">
            {item?.name || `#${id}`} ×{qty}
          </Badge>
        ))}
      </div>
    </div>
  )
}
