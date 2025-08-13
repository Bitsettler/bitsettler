'use client'

import { cn } from '@/lib/utils'
import { BricoTierBadge } from '@/components/ui/brico-tier-badge'
import Image from 'next/image'

interface ItemRowProps {
  name: string;
  qty: number;
  tier?: number;
  iconSrc?: string;
  onClick?: () => void;
  className?: string;
}

export function ItemRow({ 
  name, 
  qty, 
  tier, 
  iconSrc, 
  onClick, 
  className 
}: ItemRowProps) {
  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-center justify-between w-full p-3 rounded-lg border transition-all duration-200 ease-out',
        'hover:bg-muted/40 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-md',
        onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {/* Left side: icon + name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative flex-shrink-0 h-12 w-12 rounded-lg border bg-muted overflow-hidden">
          {iconSrc ? (
            <Image
              src={iconSrc}
              alt={name}
              width={48}
              height={48}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="w-full h-full bg-muted-foreground/20 rounded flex items-center justify-center">
              <span className="text-sm text-muted-foreground">?</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{name}</span>
          {tier && (
            <BricoTierBadge tier={tier} size="sm" className="shrink-0" />
          )}
        </div>
      </div>
      
      {/* Right side: quantity */}
      <div className="flex-shrink-0">
        <span className="qty-mono">{qty.toLocaleString()}</span>
      </div>
    </Component>
  )
}
