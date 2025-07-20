import { getItemBySlugCommand } from '@/lib/spacetime-db/modules/items/commands/get-item-by-slug'
import { ItemDetailPageLayout } from '@/views/item-views/item-detail-page-layout'
import { notFound } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{
    tag: string
    slug: string
  }>
}

export default async function ItemDetailLayout({ children, params }: LayoutProps) {
  const { tag, slug } = await params

  // Get the item by slug
  const item = getItemBySlugCommand(slug)

  // Return 404 if item not found
  if (!item) {
    notFound()
  }

  // Convert tag slug back to tag name for validation
  const tagName = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Verify the item belongs to the correct tag
  if (item.tag !== tagName) {
    notFound()
  }

  return <ItemDetailPageLayout item={item}>{children}</ItemDetailPageLayout>
}
