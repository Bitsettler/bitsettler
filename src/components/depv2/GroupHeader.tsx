'use client'

import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface GroupHeaderProps {
  title: string;
  count?: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function GroupHeader({ 
  title, 
  count, 
  isCollapsed = false, 
  onToggle, 
  className 
}: GroupHeaderProps) {
  const Component = onToggle ? 'button' : 'div'
  
  return (
    <div className={cn('sticky-header px-4 py-2', className)}>
      <Component
        onClick={onToggle}
        className={cn(
          'flex items-center justify-between w-full',
          onToggle && 'hover:bg-muted/40 rounded-md p-2 -m-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
        aria-expanded={onToggle ? !isCollapsed : undefined}
      >
        <div className="flex items-center gap-2">
          {onToggle && (
            isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )
          )}
          <h3 
            role="heading" 
            aria-level={3}
            className="font-semibold text-sm"
          >
            {title}
          </h3>
        </div>
        
        {count !== undefined && (
          <span className="chip bg-muted text-muted-foreground">
            {count} item{count !== 1 ? 's' : ''}
          </span>
        )}
      </Component>
    </div>
  )
}
