import { getCalculatorGameData } from '@/lib/spacetime-db'
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

export default async function Calculator({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { qty } = await searchParams

  // Get game data from spacetime-db
  const gameData = await getCalculatorGameData()

  // Find the item by slug
  const selectedItem = gameData.items.find((item) => item.slug === slug)
  const quantity = parseInt(qty || '1')

  // If item not found, show 404
  if (!selectedItem) {
    notFound()
  }

  return <FlowVisualizeView gameData={gameData} initialItemId={selectedItem.id} initialQuantity={quantity} />
}
