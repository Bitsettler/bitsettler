'use client'

import { Container } from '@/components/container'
import { useItemSelection } from '@/hooks/use-item-selection'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { getCalculatorGameData, type CalculatorGameData } from '@/lib/spacetime-db'
import { CalculatorItemInfoPanel } from '@/views/calculator-views/calculator-item-info-panel'
import { CalculatorSearchInput } from '@/views/calculator-views/calculator-search-input'
import { useEffect, useState } from 'react'
import { GameDataProvider } from '@/contexts/game-data-context'
import { ReactFlowProvider } from '@xyflow/react'

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [gameData, setGameData] = useState<CalculatorGameData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch game data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCalculatorGameData()
        setGameData(data)
      } catch (error) {
        console.error('Failed to fetch calculator game data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Get the current slug from the pathname
  const slug = pathname.split('/').pop()
  const selectedItem = slug && gameData ? gameData.items.find((item) => item.slug === slug) : undefined

  const { desiredQuantity, updateQuantity } = useItemSelection({
    items: gameData?.items || [],
    recipes: gameData?.recipes || [],
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

  if (loading) {
    return (
      <div className="bg-background h-[calc(100vh-3.5rem)] overflow-hidden">
        <Container className="h-full py-8">
          <div className="flex items-center justify-center h-full">
            <div>Loading calculator...</div>
          </div>
        </Container>
      </div>
    )
  }

  if (!gameData) {
    return (
      <div className="bg-background h-[calc(100vh-3.5rem)] overflow-hidden">
        <Container className="h-full py-8">
          <div className="flex items-center justify-center h-full">
            <div>Failed to load calculator data</div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <GameDataProvider gameData={gameData}>
      <ReactFlowProvider>
        <div className="bg-background h-[calc(100vh-3.5rem)] overflow-hidden">
          <Container className="h-full py-8">
            <div className="grid h-full grid-cols-12 gap-6">
              {/* Left Column - Search and Info (3 columns) */}
              <div className="col-span-3 flex min-h-0 flex-col space-y-4">
                {/* Search Card */}
                <div className="flex-shrink-0">
                  <CalculatorSearchInput items={gameData.items} selectedItem={selectedItem} onItemSelect={handleItemSelect} />
                </div>

                {/* Item Information Card */}
                <CalculatorItemInfoPanel
                  selectedItem={selectedItem}
                  desiredQuantity={desiredQuantity}
                  onQuantityChange={handleQuantityChange}
                  recipes={gameData.recipes}
                  items={gameData.items}
                />
              </div>

              {/* Right Column - Flow Canvas (9 columns) */}
              <div className="col-span-9 h-full">{children}</div>
            </div>
          </Container>
        </div>
      </ReactFlowProvider>
    </GameDataProvider>
  )
}
