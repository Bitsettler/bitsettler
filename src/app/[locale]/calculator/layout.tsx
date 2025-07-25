import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows'
import { CalculatorLayoutClient } from '@/views/calculator-views/components/calculator-layout-client'

export default async function CalculatorLayout({ children }: { children: React.ReactNode }) {
  const gameData = getCalculatorGameData()

  return <CalculatorLayoutClient gameData={gameData}>{children}</CalculatorLayoutClient>
}
