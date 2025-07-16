'use client'

import { Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useRouter } from '@/i18n/navigation'
import type { SearchData, SearchItem } from '@/lib/spacetime-db'
import { Label } from '@/components/ui/label'
import { SidebarGroup, SidebarGroupContent, SidebarInput } from '@/components/ui/sidebar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { DEFAULT_ICON_PATH } from '@/constants/assets'

interface EnhancedSearchFormProps extends React.ComponentProps<'form'> {
  searchData: SearchData
}

export function EnhancedSearchForm({ searchData, ...props }: EnhancedSearchFormProps) {
  const searchItems = searchData.items
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Don't reload the page on form submission
  }

  const filteredItems = useMemo(() => {
    if (!search || search.length < 2) return []
    
    const searchLower = search.toLowerCase()
    let filtered = searchItems.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      (item.tag && item.tag.toLowerCase().includes(searchLower))
    )
    
    // Sort results: exact matches first, then starts with, then contains
    filtered.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      
      // Exact match
      if (aName === searchLower) return -1
      if (bName === searchLower) return 1
      
      // Starts with
      if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1
      if (bName.startsWith(searchLower) && !aName.startsWith(searchLower)) return 1
      
      // Collections should appear after items for better UX
      if ((a.type === 'item' || a.type === 'cargo' || a.type === 'resource') && b.type === 'collection') return -1
      if (a.type === 'collection' && (b.type === 'item' || b.type === 'cargo' || b.type === 'resource')) return 1
      
      // Alphabetical
      return aName.localeCompare(bName)
    })
    
    // Limit to 15 results to show more variety
    filtered = filtered.slice(0, 15)
    
    console.log('Search query:', search)
    console.log('Total search items:', searchItems.length)
    console.log('Filtered results:', filtered.length)
    
    return filtered
  }, [searchItems, search])

  const handleSelect = (item: SearchItem) => {
    setOpen(false)
    setSearch('')
    router.push(item.href)
  }

  const renderSearchItem = (item: SearchItem) => (
    <CommandItem
      key={item.id}
      value={item.id}
      onSelect={() => handleSelect(item)}
      className="flex items-center gap-3 p-3"
    >
      {(item.type === 'item' || item.type === 'cargo' || item.type === 'resource') && item.icon_asset_name && (
        <Image
          src={item.icon_asset_name || `${DEFAULT_ICON_PATH}.webp`}
          alt={item.name}
          width={24}
          height={24}
          className="flex-shrink-0 rounded"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="font-medium truncate">{item.name}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.category}</span>
          {item.tier && item.tier > 0 && (
            <Badge variant="outline" className="text-xs">
              T{item.tier}
            </Badge>
          )}
          {item.rarity && (
            <Badge variant="outline" className="text-xs">
              {item.rarity}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {item.type === 'collection' ? 'Collection' : 'Guide'}
          </Badge>
        </div>
      </div>
    </CommandItem>
  )

  return (
    <form {...props} onSubmit={handleSubmit}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <SidebarInput 
                  id="search" 
                  placeholder="Search items & guides..." 
                  className="pl-8"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setOpen(e.target.value.length >= 2)
                  }}
                  onFocus={() => setOpen(search.length >= 2)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
              </div>
            </PopoverTrigger>
            {search.length >= 2 && (
              <PopoverContent 
                className="w-80 p-0" 
                side="bottom" 
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command>
                  <CommandInput className="hidden" />
                  <CommandList>
                    {filteredItems.length > 0 ? (
                      <CommandGroup>
                        {filteredItems.map(renderSearchItem)}
                      </CommandGroup>
                    ) : (
                      <CommandEmpty>
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No results found for &quot;{search}&quot;
                        </div>
                      </CommandEmpty>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            )}
          </Popover>
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}