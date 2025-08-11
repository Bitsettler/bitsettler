'use client'

import Image from 'next/image'
import { expandToBase } from '@/lib/depv2/engine'
import { getItemById } from '@/lib/depv2/indexes'
import { resolveItemDisplay } from '@/lib/settlement/item-display'
import { getServerIconPath } from '@/lib/spacetime-db-new/shared/assets'
import { BricoTierBadge } from '@/components/ui/brico-tier-badge'
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
    .map(([materialId, materialQty]) => {
      const item = itemById.get(materialId)
      const itemName = item?.name || `#${materialId}`
      
      // Try to get enhanced display info (icon, tier) from calculator data
      const displayInfo = item?.name ? resolveItemDisplay(item.name) : {}
      
      // Determine icon path with fallbacks
      let iconPath = displayInfo.iconPath
      if (iconPath) {
        iconPath = getServerIconPath(iconPath)
      } else {
        iconPath = '/assets/Unknown.webp'
      }
      
      // Determine tier with fallbacks
      const tier = displayInfo.tier || item?.tier || 0
      
      return {
        id: materialId,
        qty: materialQty,
        name: itemName,
        iconPath,
        tier
      }
    })
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {materials.length} materials • {result.steps} crafting steps
      </div>
      
      {/* Enhanced grid with thumbnails and tier badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {materials.map(({ id, qty, name, iconPath, tier }) => (
          <div key={id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
            <div className="relative flex-shrink-0">
              <Image
                src={iconPath}
                alt={name}
                width={40}
                height={40}
                className="rounded-md border bg-muted/50"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/assets/Unknown.webp'
                }}
              />
              {tier > 0 && (
                <div className="absolute -top-1 -right-1">
                  <BricoTierBadge tier={tier} size="sm" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{name}</div>
              <div className="text-xs text-muted-foreground">
                ×{qty.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
