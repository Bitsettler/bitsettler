'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
  keywords?: string
  id: string
  tier?: number
  rarity?: string
  category?: string
  icon_asset_name?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  triggerClassName?: string
  inputClassName?: string
  renderOption?: (option: ComboboxOption) => React.ReactNode
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select item...',
  searchPlaceholder = 'Search items...',
  emptyText = 'No items found.',
  className,
  triggerClassName,
  inputClassName,
  renderOption
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  // Parent ref for virtualization
  const parentRef = React.useRef<HTMLDivElement>(null)

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) {
      return options.slice(0, 50) // Show first 50 items when no search
    }
    const searchLower = searchValue.toLowerCase()
    const filtered = options.filter((option) => {
      const haystack = `${option.label} ${option.keywords || ''}`.toLowerCase()
      return haystack.includes(searchLower)
    })
    console.log('Filtered options:', { searchValue, count: filtered.length, open })
    return filtered
  }, [options, searchValue, open])

  // Set up virtualization
  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (renderOption ? 56 : 36), // Approximate height of each CommandItem (taller for custom rendering)
    overscan: 5 // Number of items to render outside the visible area
  })

  const virtualOptions = virtualizer.getVirtualItems()

  // Force virtualizer to recalculate on open and when filteredOptions change
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

  // Recalculate virtualizer when filtered options change
  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        virtualizer.measure()
      })
    }
  }, [open, filteredOptions.length, virtualizer])

  // Force update when popover opens with existing search
  React.useEffect(() => {
    if (open && searchValue) {
      // Small delay to ensure the popover is fully rendered
      setTimeout(() => {
        virtualizer.measure()
      }, 50)
    }
  }, [open, searchValue, virtualizer])

  // Calculate total height - ensure it's at least the height of visible items
  const itemHeight = renderOption ? 56 : 36
  const totalHeight = Math.max(
    virtualizer.getTotalSize(),
    Math.min(filteredOptions.length * itemHeight, 300) // Max 300px height
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className, triggerClassName)}
        >
          {value ? options.find((option) => option.value === value)?.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false} key={open ? 'open' : 'closed'}>
          <CommandInput
            placeholder={searchPlaceholder}
            className={cn('h-9', inputClassName)}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList ref={parentRef} className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.length > 0 && (
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
                        key={option.id}
                        value={`${option.label} ${option.keywords || ''}`}
                        className="absolute top-0 left-0 w-full bg-transparent whitespace-nowrap"
                        style={{
                          height: `${virtualOption.size}px`,
                          transform: `translateY(${virtualOption.start}px)`
                        }}
                        onSelect={() => {
                          onValueChange(option.value)
                          setOpen(false)
                          // Keep search value so user can return to their search
                        }}
                      >
                        {renderOption ? (
                          <div className="flex w-full items-center justify-between">
                            {renderOption(option)}
                            <Check
                              className={cn(
                                'ml-2 h-4 w-4 flex-shrink-0',
                                value === option.value ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          </div>
                        ) : (
                          <>
                            {option.label}
                            <Check
                              className={cn('ml-auto h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')}
                            />
                          </>
                        )}
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
