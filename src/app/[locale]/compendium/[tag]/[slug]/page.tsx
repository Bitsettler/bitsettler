import { getItemBySlugCommand } from '@/lib/spacetime-db-new/modules/items/commands/get-item-by-slug'
import { ItemIndividualInfoPageView } from '@/views/item-views/item-individual-info-page-view'
import { notFound } from 'next/navigation'

// Generate static params for all items
// export function generateStaticParams() {
//   const itemSlugs = getAllItemSlugsCommand()

//   return itemSlugs.map((item) => ({
//     tag: item.tag.toLowerCase().replace(/\s+/g, '-'),
//     slug: item.slug
//   }))
// }

// Generate metadata for the item page
// export async function generateMetadata({ params }: { params: Promise<{ tag: string; slug: string }> }) {
//   const { slug } = await params
//   const item = getItemBySlugCommand(slug)

//   if (!item) {
//     return {
//       title: 'Item Not Found',
//       description: 'The requested item could not be found.'
//     }
//   }

//   return {
//     title: `${item.name} - BitCraft Guide`,
//     description: item.description || `Information about ${item.name} in BitCraft`
//   }
// }

interface PageProps {
  params: Promise<{
    tag: string
    slug: string
  }>
}


export default async function ItemInfoPage({ params }: PageProps) {
  const { slug } = await params

  // Get the item by slug (validation already done in layout)
  const item = getItemBySlugCommand(slug)

  if (!item) {
    notFound()
  }

  return <ItemIndividualInfoPageView item={item} />
}
