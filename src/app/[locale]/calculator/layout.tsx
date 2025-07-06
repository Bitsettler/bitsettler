'use client'

import { Container } from '@/components/container'
import { useItemSelection } from '@/hooks/use-item-selection'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Recipe } from '@/lib/types'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import cargo from '@/data/cargo.json'
import items from '@/data/items.json'
import recipes from '@/data/recipes.json'
import resources from '@/data/resources.json'
import { CalculatorItemInfoPanel } from '@/view/calculator-page-view/calculator-item-info-panel'
import { CalculatorSearchInput } from '@/view/calculator-page-view/calculator-search-input'

// Prepare and combine all game data
const allItems = [...items, ...cargo, ...resources]

const gameData = {
  items: allItems,
  recipes: recipes as Recipe[]
}

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { items, recipes } = gameData

  // Get the current slug from the pathname
  const slug = pathname.split('/').pop()
  const selectedItem = slug ? items.find((item) => item.slug === slug) : undefined

  const { desiredQuantity, updateQuantity } = useItemSelection({
    items,
    recipes,
    initialQuantity: parseInt(searchParams.get('qty') || '1')
  })

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(newQuantity)
    // Update URL with new quantity
    const params = new URLSearchParams(searchParams)
    params.set('qty', newQuantity.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleItemSelect = (slug: string) => {
    router.push(`/calculator/${slug}?qty=${desiredQuantity}`)
  }

  return (
    <div className="bg-background h-[calc(100vh-3.5rem)] overflow-hidden">
      <Container className="h-full py-8">
        <div className="grid h-full grid-cols-12 gap-6">
          {/* Left Column - Search and Info (3 columns) */}
          <div className="col-span-3 flex flex-col space-y-4">
            {/* Title and Subtitle */}
            <div className="text-left">
              <h1 className="text-foreground mb-2 text-3xl font-bold">{t('header.title')}</h1>
              <p className="text-muted-foreground text-lg">{t('header.subtitle')}</p>
            </div>

            {/* Search Card (1) */}
            <CalculatorSearchInput items={items} selectedItem={selectedItem} onItemSelect={handleItemSelect} />

            {/* Item Information Card (2) */}
            {selectedItem && (
              <CalculatorItemInfoPanel
                selectedItem={selectedItem}
                desiredQuantity={desiredQuantity}
                onQuantityChange={handleQuantityChange}
                recipes={recipes}
              />
            )}
          </div>

          {/* Right Column - Flow Canvas (3) */}
          <div className="col-span-9 h-full overflow-hidden">{children}</div>
        </div>
      </Container>
    </div>
  )
}
