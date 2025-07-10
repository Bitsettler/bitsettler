'use client'

import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { SITE_CONFIG } from '@/config/site-config'
import cargoDescData from '@/data/global/cargo_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import { Link } from '@/i18n/navigation'
import { convertToCompendiumEntity } from '@/lib/spacetime-db'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function Header() {
  const t = useTranslations()
  const router = useRouter()

  // Load and convert server data using spacetime-db utilities
  const items = (itemDescData as any[])
    .filter((item) => item.compendium_entry)
    .map((item) => convertToCompendiumEntity(item, 'item'))
  const cargo = (cargoDescData as any[])
    .filter((cargo) => cargo.compendium_entry)
    .map((cargo) => convertToCompendiumEntity(cargo, 'cargo'))
  const resources = (resourceDescData as any[])
    .filter((resource) => resource.compendium_entry)
    .map((resource) => convertToCompendiumEntity(resource, 'resource'))
  const allEntities = [...items, ...cargo, ...resources]

  // Build combobox options
  const searchOptions: ComboboxOption[] = allEntities.map((entity) => ({
    value: (entity as any).slug || entity.name || String(entity.id),
    label: entity.name,
    keywords: `${entity.name} ${entity.tag || ''} ${entity.rarity ? entity.rarity : ''}`,
    id: String(entity.id),
    tier: entity.tier,
    rarity: entity.rarity ? (Array.isArray(entity.rarity) ? entity.rarity[0] : entity.rarity) : undefined,
    category: entity.tag,
    icon_asset_name: (entity as any).iconAssetName || (entity as any).icon_asset_name || ''
  }))

  const handleSearchSelect = (slug: string) => {
    if (!slug) return
    // Try to find the entity and route to its page (customize as needed)
    const found = allEntities.find((e) => (e as any).slug === slug || e.name === slug || String(e.id) === slug)
    if (found) {
      if (found.entityType === 'item') {
        router.push(`/compendium/${found.tag?.toLowerCase().replace(/\s+/g, '-') || 'item'}`)
      } else if (found.entityType === 'cargo') {
        router.push(`/compendium/${found.tag?.toLowerCase().replace(/\s+/g, '-') || 'cargo'}`)
      } else if (found.entityType === 'resource') {
        router.push(`/compendium/${found.tag?.toLowerCase().replace(/\s+/g, '-') || 'resource'}`)
      }
    }
  }

  return (
    <header className="bg-background border-border sticky top-0 z-50 w-full border-b">
      <div className="flex h-14 items-center gap-4 px-4">
        <SidebarTrigger />
        <Link href="/" className="text-xl font-bold">
          {SITE_CONFIG.name}
        </Link>
        <div className="flex-1">
          <Combobox
            options={searchOptions}
            value=""
            onValueChange={handleSearchSelect}
            placeholder={t('search.globalPlaceholder')}
            searchPlaceholder={t('search.globalPlaceholder')}
            emptyText={t('calculator.noItemsFound')}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
