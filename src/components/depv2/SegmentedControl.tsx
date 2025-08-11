'use client'

import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'
import type { SegmentOption } from './types'

interface SegmentedControlProps {
  segments: SegmentOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SegmentedControl({ 
  segments, 
  value, 
  onChange, 
  className 
}: SegmentedControlProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = index > 0 ? index - 1 : segments.length - 1
        break
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = index < segments.length - 1 ? index + 1 : 0
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = segments.length - 1
        break
      default:
        return
    }

    setFocusedIndex(nextIndex)
    buttonsRef.current[nextIndex]?.focus()
  }

  return (
    <div 
      role="tablist" 
      aria-label="Calculator view options"
      className={cn('segmented-control', className)}
    >
      {segments.map((segment, index) => (
        <button
          key={segment.id}
          ref={(el) => { buttonsRef.current[index] = el }}
          role="tab"
          aria-selected={value === segment.id}
          aria-controls={`panel-${segment.id}`}
          tabIndex={focusedIndex === index || (focusedIndex === -1 && value === segment.id) ? 0 : -1}
          data-active={value === segment.id}
          className="segmented-control-button"
          onClick={() => onChange(segment.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(-1)}
        >
          {segment.label}
        </button>
      ))}
    </div>
  )
}
