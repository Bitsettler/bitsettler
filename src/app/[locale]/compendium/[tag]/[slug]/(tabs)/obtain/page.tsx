import { getEnrichedCraftingRecipesByOutputItemId } from '@/lib/spacetime-db-new/modules/crafting-recipes/flows'
import { getEnrichedExtractionRecipesByOutputItemId } from '@/lib/spacetime-db-new/modules/extraction-recipes/flows'
import { getItemBySlugCommand } from '@/lib/spacetime-db-new/modules/items/commands/get-item-by-slug'
import { ItemIndividualObtainPageView } from '@/views/item-views/item-individual-obtain-page-view'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    tag: string
    slug: string
  }>
}

export default async function ItemObtainTab({ params }: PageProps) {
  const { slug } = await params

  // Get the item by slug (validation already done in layout)
  const item = getItemBySlugCommand(slug)

  if (!item) {
    notFound()
  }

  // Get enriched recipes that produce this item
  const craftingRecipes = getEnrichedCraftingRecipesByOutputItemId(item.id)
  const extractionRecipes = getEnrichedExtractionRecipesByOutputItemId(item.id)

  return (
    <ItemIndividualObtainPageView
      craftingRecipes={craftingRecipes}
      extractionRecipes={extractionRecipes}
      itemName={item.name}
    />
  )
}
