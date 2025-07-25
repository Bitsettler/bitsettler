import { getItemBySlugCommand } from '@/lib/spacetime-db-new/modules/items/commands/get-item-by-slug'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    tag: string
    slug: string
  }>
}

export default async function ItemConstructionTab({ params }: PageProps) {
  const { slug } = await params

  // Get the item by slug (validation already done in layout)
  const item = getItemBySlugCommand(slug)

  if (!item) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>Construction with {item.name}</h2>
        <p className="text-muted-foreground">
          Information about construction projects that use this item will be available soon. This may include building
          recipes, placement requirements, and construction details.
        </p>
      </div>
    </div>
  )
}
