'use client'

import { CaretUp, CaretDown } from '@phosphor-icons/react'
import { TableHead } from '@/components/ui/table'

interface SortableTableHeaderProps {
  children: React.ReactNode
  sortKey: string
  currentSort: { key: string; direction: 'asc' | 'desc' } | null
  onSort: (key: string) => void
  className?: string
}

export function SortableTableHeader({ 
  children, 
  sortKey, 
  currentSort, 
  onSort, 
  className = "text-center cursor-pointer hover:bg-accent/50 transition-colors" 
}: SortableTableHeaderProps) {
  const isActive = currentSort?.key === sortKey
  const direction = currentSort?.direction

  return (
    <TableHead 
      className={className}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-center gap-1">
        {children}
        <div className="flex flex-col">
          <CaretUp 
            size={12} 
            className={`${isActive && direction === 'asc' ? 'text-primary' : 'text-muted-foreground/50'}`} 
          />
          <CaretDown 
            size={12} 
            className={`${isActive && direction === 'desc' ? 'text-primary' : 'text-muted-foreground/50'} -mt-1`} 
          />
        </div>
      </div>
    </TableHead>
  )
}