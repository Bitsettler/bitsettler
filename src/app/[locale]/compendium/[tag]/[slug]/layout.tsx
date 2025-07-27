import { getItemBySlugCommand } from '@/lib/spacetime-db-new/modules/items/commands/get-item-by-slug'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { ItemDetailPageLayout } from '@/views/item-views/item-detail-page-layout'
import { notFound } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{
    tag: string
    slug: string
  }>
}

export const dynamicParams = true
export const revalidate = false

export async function generateMetadata({
  params
}: {
  params: Promise<{ tag: string; slug: string }>
}) {
  const { slug } = await params
  const item = getItemBySlugCommand(slug)

  if (!item) {
    return {
      title: 'Item Not Found',
      description: 'The requested item could not be found.'
    }
  }

  return {
    title: `${item.name} - BitCraft Guide`,
    description:
      item.description || `Information about ${item.name} in BitCraft`
  }
}

export default async function ItemDetailLayout({
  children,
  params
}: LayoutProps) {
  const { tag, slug } = await params

  const item = getItemBySlugCommand(slug)

  if (!item) {
    notFound()
  }

  if (createSlug(item.tag) !== tag) {
    notFound()
  }

  return <ItemDetailPageLayout item={item}>{children}</ItemDetailPageLayout>
}
