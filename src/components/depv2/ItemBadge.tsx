'use client'
import React from 'react'
import Image from 'next/image'
import { getItemDisplay } from '@/lib/depv2/display'
import { BricoTierBadge } from '@/components/ui/brico-tier-badge'

export function ItemBadge({ id, qty, showQuantity = true }: { id: string; qty?: number; showQuantity?: boolean }) {
  const d = getItemDisplay(id) // pure lookup
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 flex-shrink-0 rounded-md bg-muted p-1 border">
          <Image 
            src={d.icon} 
            alt={d.name} 
            fill
            sizes="40px"
            className="object-contain rounded-md" 
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/assets/Unknown.webp'
            }}
          />
          {d.tier && d.tier > 0 && (
            <div className="absolute -top-2 -right-2">
              <BricoTierBadge tier={d.tier} size="sm" />
            </div>
          )}
        </div>
        <span className="font-medium">{d.name}</span>
      </div>
      {showQuantity && typeof qty === 'number' && (
        <span className="font-mono text-sm font-semibold">
          {qty.toLocaleString()}
        </span>
      )}
    </div>
  )
}
