'use client'

import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar'
import { Link, useRouter } from '@/i18n/navigation'
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
    <CommandItem
      key={item.id}
      value={item.id}
      onSelect={() => {
        setOpen(false)
        setSearch('')
        router.push(item.href)
      }}
      className="flex items-center gap-3 p-3"
    >
      <Link href={item.href} className="flex w-full items-center gap-3">
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
      </Link>
    </CommandItem>
  )

  return (
    <div {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <div className="relative">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search items & guides..."
                value={search}
                onValueChange={(value) => {
                  setSearch(value)
                  setOpen(value.length >= 2)
                }}
                wrapperClassname="border-none"
              />
              {search.length >= 2 && (
                <div className="bg-popover absolute top-full left-0 z-50 mt-1 w-80 rounded-md border p-0 shadow-md">
                  <CommandList>
                    {filteredItems.length > 0 ? (
                      <CommandGroup>
                        {filteredItems.map(renderSearchItem)}
                      </CommandGroup>
                    ) : (
                      <CommandEmpty>No results found.</CommandEmpty>
                    )}
                  </CommandList>
                </div>
              )}
            </Command>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  )
}
