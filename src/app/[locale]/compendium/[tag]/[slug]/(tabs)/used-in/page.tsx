import { getItemBySlugCommand } from '@/lib/spacetime-db-new/modules/items/commands/get-item-by-slug'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    tag: string
    slug: string
  }>
}

export default async function ItemUsedInTab({ params }: PageProps) {
  const { slug } = await params

  // Get the item by slug (validation already done in layout)
  const item = getItemBySlugCommand(slug)

  if (!item) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>What {item.name} is Used For</h2>
        <p className="text-muted-foreground">
          Information about what this item is used for will be available soon.
          This may include crafting recipes that use this item as an ingredient,
          equipment stats, and other uses.
        </p>
      </div>
    </div>
  )
}
