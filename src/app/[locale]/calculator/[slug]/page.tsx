import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows'
import { CalcultorFlowView } from '@/views/calculator-views/calculator-flow-view'
import { notFound } from 'next/navigation'

interface CalculatorPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
  searchParams: Promise<{
    qty?: string
  }>
}

export default async function Calculator({
  params,
  searchParams
}: CalculatorPageProps) {
  const { slug } = await params
  const { qty } = await searchParams

  const gameData = getCalculatorGameData()

  const selectedItem = gameData.items.find((item) => item.slug === slug)
  const quantity = parseInt(qty || '1')

  if (!selectedItem) {
    notFound()
  }

  return <CalcultorFlowView slug={slug} quantity={quantity} />
}
