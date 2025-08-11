'use client'
import React from 'react'
import Image from 'next/image'
import { getItemDisplay } from '@/lib/depv2/display'

export function ItemBadge({ id, qty }: { id: string; qty?: number }) {
  const d = getItemDisplay(id) // pure lookup
  return (
    <div className="flex items-center justify-between gap-3 rounded bg-muted/30 px-2 py-1 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <Image 
          src={d.icon} 
          alt={d.name} 
          width={18} 
          height={18} 
          className="rounded-sm object-contain" 
          loading="lazy" 
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/assets/Unknown.webp'
          }}
        />
        <div className="min-w-0">
          <div className="truncate">{d.name}</div>
          <div className="text-xs opacity-70 flex items-center gap-2">
            {d.tier ? <span className="inline-block rounded px-1 bg-emerald-900/40">T{d.tier}</span> : null}
            {d.skill ? <span className="inline-block rounded px-1 bg-slate-800/40">{d.skill}</span> : null}
          </div>
        </div>
      </div>
      {typeof qty === 'number' ? <span className="font-mono">×{qty}</span> : null}
    </div>
  )
}
