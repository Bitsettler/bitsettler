import { Container } from '@/components/container'
import { SITE_CONFIG } from '@/config/site-config'
import { I18N_CONFIG } from '@/i18n/config'
import { getCalculatorGameData } from '@/lib/spacetime-db'
import { CalculatorIndexClient } from '@/views/calculator-views/calculator-index-page-view'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

export function generateStaticParams() {
  return I18N_CONFIG.locales.map((locale) => ({ locale }))
}

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

  try {
    const gameData = await getCalculatorGameData()

    return <CalculatorIndexClient gameData={gameData} />
  } catch (error) {
    console.error('Failed to fetch calculator game data:', error)
    return (
      <div className="bg-background min-h-screen">
        <Container className="py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-foreground mb-4 text-4xl font-bold">Recipe Calculator</h1>
            <p className="text-muted-foreground">Failed to load calculator data. Please try again later.</p>
          </div>
        </Container>
      </div>
    )
  }
}
