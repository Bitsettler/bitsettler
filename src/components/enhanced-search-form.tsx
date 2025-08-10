'use client'

import { Badge } from '@/components/ui/badge'

import { Label } from '@/components/ui/label'
import { SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar'
import { Link, useRouter } from '@/i18n/navigation'
import { Search, Command as CommandIcon } from 'lucide-react'
import {
  cleanIconAssetName,
  getServerIconPath
} from '@/lib/spacetime-db-new/shared/assets'
import type { SearchData } from '@/lib/spacetime-db-new/shared/dtos/search-dtos'
import { getTierColor } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getRarityColor } from '@/lib/spacetime-db-new/shared/utils/rarity'
import Image from 'next/image'
import { useState } from 'react'

interface EnhancedSearchFormProps extends React.ComponentProps<'div'> {
  searchData: SearchData
}

export function EnhancedSearchForm({
  searchData,
  ...props
}: EnhancedSearchFormProps) {
  const searchItems = searchData.items
  const [, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  // Convert search items to combobox options
  const filteredItems =
    search.length >= 2
      ? searchItems
          .filter(
            (item) =>
              item.name.toLowerCase().includes(search.toLowerCase()) ||
              item.category.toLowerCase().includes(search.toLowerCase()) ||
              (item.tag &&
                item.tag.toLowerCase().includes(search.toLowerCase()))
          )
          // Deduplicate by name - keep only the first occurrence of each name
          .filter((item, index, array) => {
            const normalizedName = item.name.toLowerCase().trim()
            return (
              array.findIndex(
                (i) => i.name.toLowerCase().trim() === normalizedName
              ) === index
            )
          })
          .slice(0, 15)
      : []

  const renderSearchItem = (item: SearchData['items'][number]) => (
    <div
      key={item.id}
      onClick={() => {
        setOpen(false)
        setSearch('')
        router.push(item.href)
      }}
      className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex w-full items-center gap-3">
        {item.icon_asset_name && (
          <Image
            src={getServerIconPath(cleanIconAssetName(item.icon_asset_name))}
            alt={item.name}
            width={32}
            height={32}
            className="flex-shrink-0 rounded"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-y-1">
          <div className="truncate font-medium">{item.name}</div>
          <div className="flex items-center gap-1">
            {item.tier && item.tier > 0 && (
              <Badge variant="outline" className={getTierColor(item.tier)}>
                Tier {item.tier}
              </Badge>
            )}
            {item.rarity && (
              <Badge variant="outline" className={getRarityColor(item.rarity)}>
                {item.rarity}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-700"
            >
              {item.category}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <div className="relative">
            {/* Modern search container with glass effect */}
            <div className="relative rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm transition-all duration-200 hover:border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 shadow-sm">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search items & guides..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setOpen(e.target.value.length >= 2)
                }}
                className="h-9 w-full border-none bg-transparent pl-10 pr-16 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0"
              />
              
              {/* Command indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="flex items-center gap-0.5 rounded-md border border-border/40 bg-muted/60 px-1.5 py-1 text-xs font-medium text-muted-foreground">
                  <CommandIcon className="h-3 w-3" />
                  <span className="font-mono">K</span>
                </div>
              </div>
            </div>

            {/* Enhanced dropdown with better styling */}
            {search.length >= 2 && (
              <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[320px] rounded-lg border border-border/60 bg-popover/95 backdrop-blur-md p-0 shadow-lg ring-1 ring-black/5">
                <div className="max-h-80 overflow-y-auto">
                  {filteredItems.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {filteredItems.map(renderSearchItem)}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <div>No results found</div>
                        <div className="text-xs">Try a different search term</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  )
}
