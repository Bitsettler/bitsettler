import { getItemBySlugCommand } from '@/lib/spacetime-db-new/modules/items/commands/get-item-by-slug'
import { ItemIndividualInfoPageView } from '@/views/item-views/item-individual-info-page-view'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    tag: string
    slug: string
  }>
}

export default async function ItemInfoPage({ params }: PageProps) {
  const { slug } = await params

  const item = getItemBySlugCommand(slug)

  if (!item) {
    notFound()
  }

  return <ItemIndividualInfoPageView item={item} />
}
