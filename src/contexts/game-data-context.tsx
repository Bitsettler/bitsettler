'use client'

import type { CalculatorGameData } from '@/lib/spacetime-db'
import { createContext, useContext } from 'react'

const GameDataContext = createContext<CalculatorGameData | null>(null)

export function GameDataProvider({ children, gameData }: { children: React.ReactNode; gameData: CalculatorGameData }) {
  return <GameDataContext.Provider value={gameData}>{children}</GameDataContext.Provider>
}

export function useGameData() {
  const context = useContext(GameDataContext)
  if (!context) {
    throw new Error('useGameData must be used within a GameDataProvider')
  }
  return context
}
