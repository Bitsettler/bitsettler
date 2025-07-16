import { CalculatorLayoutClient } from '@/views/calculator-views/components/calculator-layout-client'
import { getCalculatorGameData } from '@/lib/spacetime-db'

export default async function CalculatorLayout({ children }: { children: React.ReactNode }) {
  try {
    const gameData = await getCalculatorGameData()
    
    return (
      <CalculatorLayoutClient gameData={gameData}>
        {children}
      </CalculatorLayoutClient>
    )
  } catch (error) {
    console.error('Failed to fetch calculator game data:', error)
    return (
      <div className="bg-background h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Failed to load calculator data</div>
        </div>
      </div>
    )
  }
}

