import { SITE_CONFIG } from '@/config/site-config'
import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows'
import { CalculatorIndexClient } from '@/views/calculator-views/calculator-index-page-view'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

export const dynamicParams = true
export const revalidate = false

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Recipe Calculator - ${SITE_CONFIG.name}`,
    description: `Interactive recipe calculator for ${SITE_CONFIG.name}. Calculate exact material requirements and visualize crafting dependencies.`
  }
}

export default async function CalculatorIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  const gameData = getCalculatorGameData()

  return <CalculatorIndexClient gameData={gameData} />
}
