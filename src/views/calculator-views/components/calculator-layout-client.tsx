'use client'

import { Container } from '@/components/container'
import { GameDataProvider } from '@/contexts/game-data-context'
import { useCalculatorSaves } from '@/hooks/use-calculator-saves'
import { useItemSelection } from '@/hooks/use-item-selection'
import { usePathname, useRouter } from '@/i18n/navigation'
import type { CalculatorGameData } from '@/lib/spacetime-db'
import { ReactFlowProvider } from '@xyflow/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CalculatorHeader } from './calculator-header'

interface CalculatorLayoutClientProps {
  children: React.ReactNode
  gameData: CalculatorGameData
}

function CalculatorLayoutClientContent({ children, gameData }: CalculatorLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { loadCalculator } = useCalculatorSaves()

  // Get the current slug from the pathname
  const slug = pathname.split('/').pop()
  const selectedItem = slug ? gameData.items.find((item) => item.slug === slug) : undefined

  // Check for saved state and use its quantity if available and no qty param in URL
  const savedState = slug ? loadCalculator(slug) : null
  const urlQuantity = parseInt(searchParams.get('qty') || '0')
  const initialQuantity = urlQuantity > 0 ? urlQuantity : savedState?.quantity || 1

  const { desiredQuantity, updateQuantity } = useItemSelection({
    items: gameData.items,
    recipes: gameData.recipes,
    initialQuantity
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
    <GameDataProvider gameData={gameData}>
      <ReactFlowProvider>
        <div className="bg-background flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
          {/* Calculator Header */}
          <CalculatorHeader
            items={gameData.items}
            selectedItem={selectedItem}
            desiredQuantity={desiredQuantity}
            onItemSelect={handleItemSelect}
            onQuantityChange={handleQuantityChange}
          />

          {/* Flow Canvas Content */}
          <div className="flex-1 overflow-hidden">
            <Container className="h-full p-4 sm:px-4 lg:px-4">{children}</Container>
          </div>
        </div>
      </ReactFlowProvider>
    </GameDataProvider>
  )
}

export function CalculatorLayoutClient({ children, gameData }: CalculatorLayoutClientProps) {
  return (
    <Suspense fallback={<div>Loading calculator...</div>}>
      <CalculatorLayoutClientContent gameData={gameData}>{children}</CalculatorLayoutClientContent>
    </Suspense>
  )
}
