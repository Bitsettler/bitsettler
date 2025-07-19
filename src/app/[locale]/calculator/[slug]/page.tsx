import { getCalculatorGameData } from '@/lib/spacetime-db/modules/calculator/flows'
import { FlowVisualizeView } from '@/views/calculator-views/calculator-view'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
  searchParams: Promise<{
    qty?: string
  }>
}

export function generateStaticParams() {
  const gameData = getCalculatorGameData()

  return gameData.items.map((each) => {
    return { slug: each.slug }
  })
}

export default async function Calculator({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { qty } = await searchParams

  // Get game data from spacetime-db
  const gameData = getCalculatorGameData()

  // Find the item by slug to validate it exists
  const selectedItem = gameData.items.find((item) => item.slug === slug)
  const quantity = parseInt(qty || '1')

  // If item not found, show 404
  if (!selectedItem) {
    notFound()
  }

  return <FlowVisualizeView slug={slug} quantity={quantity} />
}
