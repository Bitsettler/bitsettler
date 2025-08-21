'use client'

import { useState, useEffect, useRef } from 'react'
import { searchItems, getItemIndex } from '@/lib/depv2/itemIndex'
import type { ItemIndexEntry } from '@/lib/depv2/itemIndex'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BricoTierBadge } from '@/components/ui/brico-tier-badge'

interface ItemPickerProps {
  value?: string
  onChange: (id: string) => void
}

export default function ItemPicker({ value, onChange }: ItemPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ItemIndexEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemIndexEntry | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  
  // Update selected item when value prop changes
  useEffect(() => {
    if (value) {
      const itemIndex = getItemIndex()
      const item = itemIndex.find(i => i.id === value)
      setSelectedItem(item || null)
      if (item?.name) {
        setQuery(item.name)
      } else {
        setQuery(value)
      }
    }
  }, [value])
  
  // Search when query changes
  useEffect(() => {
    if (query.trim()) {
      // Don't search if query exactly matches the selected item
      if (selectedItem && query === selectedItem.name) {
        setResults([])
        setIsOpen(false)
        return
      }
      
      const searchResults = searchItems(query, 10)
      setResults(searchResults)
      setIsOpen(searchResults.length > 0)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query, selectedItem])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSelectItem = (item: ItemIndexEntry) => {
    setSelectedItem(item)
    setQuery(item.name || item.id)
    setResults([]) // Clear results immediately
    setIsOpen(false)
    onChange(item.id)
    // Blur the input to prevent refocus issues
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    // Clear selected item if query doesn't match anymore
    if (!newQuery.trim()) {
      setSelectedItem(null)
    } else if (selectedItem && newQuery !== selectedItem.name) {
      setSelectedItem(null)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' && results.length > 0) {
      handleSelectItem(results[0])
    }
  }
  
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          // Only open if we have results and no selected item, or if query doesn't match selected item
          if (results.length > 0 && (!selectedItem || query !== selectedItem.name)) {
            setIsOpen(true)
          }
        }}
        placeholder="Search items by name or ID..."
        className="w-full"
      />
      
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto bg-background border border-border rounded-md shadow-lg"
        >
          {results.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start px-3 py-2 h-auto font-normal hover:bg-accent"
              onClick={() => handleSelectItem(item)}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="font-medium">
                  {item.name || item.id}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  {item.tier && (
                                                <BricoTierBadge tier={item.tier} size="sm" className="shrink-0" />
                  )}
                  {item.craftable && (
                    <Badge variant="secondary" className="text-xs">
                      Craftable
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {item.id}
                  </Badge>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
