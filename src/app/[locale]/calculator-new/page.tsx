import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { CalculatorNewView } from '@/views/calculator-views/calculator-new-view'

interface CalculatorNewPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Project Calculator - BitSettler',
    description: 'Project-focused crafting calculator for BitCraft with collaboration features and advanced planning capabilities.',
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
