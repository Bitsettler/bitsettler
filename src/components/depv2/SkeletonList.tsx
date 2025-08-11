'use client'

import { cn } from '@/lib/utils'

interface SkeletonListProps {
  rows?: number;
  className?: string;
}

export function SkeletonList({ rows = 12, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-lg border"
        >
          {/* Left side: icon + name skeleton */}
          <div className="flex items-center gap-3 flex-1">
            <div className="skeleton h-10 w-10 rounded-md" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          
          {/* Right side: quantity skeleton */}
          <div className="skeleton h-4 w-12 rounded" />
        </div>
      ))}
    </div>
  )
}
