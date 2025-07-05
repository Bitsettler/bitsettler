'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/src/lib/utils'

interface ComboboxOption {
  value: string
  label: string
  keywords?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select item...',
  searchPlaceholder = 'Search items...',
  emptyText = 'No items found.',
  className
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  // Parent ref for virtualization
  const parentRef = React.useRef<HTMLDivElement>(null)

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) {
      return []
    }
    const searchLower = searchValue.toLowerCase()
    return options.filter((option) => {
      const haystack = `${option.label} ${option.keywords || ''}`.toLowerCase()
      return haystack.includes(searchLower)
    })
  }, [options, searchValue])

  // Set up virtualization
  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Approximate height of each CommandItem
    overscan: 5 // Number of items to render outside the visible area
  })

  const virtualOptions = virtualizer.getVirtualItems()

  // Force virtualizer to recalculate on open using ResizeObserver and animation frame
  React.useEffect(() => {
    if (!open || !parentRef.current) return
    const ro = new window.ResizeObserver(() => {
      setTimeout(() => {
        requestAnimationFrame(() => {
          virtualizer.measure()
          virtualizer.scrollToIndex(0)
        })
      }, 0)
    })
    ro.observe(parentRef.current)
    return () => ro.disconnect()
  }, [open, virtualizer])

  // Calculate total height - ensure it's at least the height of visible items
  const totalHeight = Math.max(
    virtualizer.getTotalSize(),
    Math.min(filteredOptions.length * 36, 300) // Max 300px height
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {value ? options.find((option) => option.value === value)?.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList ref={parentRef} className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>{searchValue ? emptyText : 'Type to search...'}</CommandEmpty>
            <CommandGroup>
              {searchValue && filteredOptions.length > 0 && (
                <div
                  style={{
                    height: `${totalHeight}px`,
                    width: '100%',
                    position: 'relative'
                  }}
                >
                  {virtualOptions.map((virtualOption) => {
                    const option = filteredOptions[virtualOption.index]
                    return (
                      <CommandItem
                        key={option.value}
                        value={`${option.label} ${option.keywords || ''}`}
                        className="absolute top-0 left-0 w-full bg-transparent whitespace-nowrap"
                        style={{
                          height: `${virtualOption.size}px`,
                          transform: `translateY(${virtualOption.start}px)`
                        }}
                        onSelect={() => {
                          onValueChange(option.value)
                          setOpen(false)
                          setSearchValue('') // Clear search when item is selected
                        }}
                      >
                        {option.label}
                        <Check
                          className={cn('ml-auto h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')}
                        />
                      </CommandItem>
                    )
                  })}
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
