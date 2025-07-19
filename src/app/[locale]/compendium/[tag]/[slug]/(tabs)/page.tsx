import { getItemBySlugCommand } from '@/lib/spacetime-db/modules/items/commands/get-item-by-slug'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    tag: string
    slug: string
  }>
}

export default async function ItemInfoTab({ params }: PageProps) {
  const { slug } = await params
  
  // Get the item by slug (validation already done in layout)
  const item = getItemBySlugCommand(slug)

  if (!item) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Item Description Section */}
      {item.description && (
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h2>Description</h2>
          <p className="text-lg leading-relaxed">{item.description}</p>
        </div>
      )}

      {/* Placeholder for future content sections */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>Item Information</h2>
        <p className="text-muted-foreground">
          Detailed information about this item will be available soon. Use the tabs above to explore different aspects of {item.name}.
        </p>
      </div>
    </div>
  )
}