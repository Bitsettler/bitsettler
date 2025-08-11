'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  header?: {
    title: string;
    icon?: ReactNode;
    action?: ReactNode;
  };
}

export function GlassCard({ children, className, header }: GlassCardProps) {
  return (
    <div className={cn(
      'glass card-radius shadow-md p-6',
      className
    )}>
      {header && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            {header.icon}
            <h2 className="text-lg font-semibold">{header.title}</h2>
          </div>
          {header.action}
        </div>
      )}
      {children}
    </div>
  )
}
