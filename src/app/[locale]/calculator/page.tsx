import { SITE_CONFIG } from '@/config/site-config'
import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows'
import { CalculatorFlowView } from '@/views/calculator-views/calculator-flow-view'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

export const dynamicParams = true
export const revalidate = false

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Visual Calculator - ${SITE_CONFIG.name}`,
    description: `Interactive visual calculator for ${SITE_CONFIG.name}. Calculate exact material requirements and visualize crafting dependencies.`
  }
}

export default async function CalculatorIndexPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  // Redirect directly to a default flow view to skip the redundant landing page
  // Users can search for items using the header search in the flow view
  return <CalculatorFlowView slug="basic-hammer" quantity={1} />
}
