import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { CalculatorNewView } from '@/views/calculator-views/calculator-new-view'

interface CalculatorNewPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Calculator (New) - BitSettler',
    description: 'Advanced dependency engine for BitCraft crafting calculations with step-by-step plans and material optimization.',
  }
}

export default async function CalculatorNewPage({
  params
}: CalculatorNewPageProps) {
  const { locale } = await params
  
  // Enable static rendering
  setRequestLocale(locale)

  return <CalculatorNewView />
}
