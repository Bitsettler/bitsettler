import type { EnrichedCraftingRecipe } from '@/lib/spacetime-db-new/modules/crafting-recipes/flows'
import type { EnrichedExtractionRecipe } from '@/lib/spacetime-db-new/modules/extraction-recipes/flows'
import { ItemObtainRecipesTable } from './item-obtain-recipes-table'

interface ItemIndividualObtainPageViewProps {
  craftingRecipes: EnrichedCraftingRecipe[]
  extractionRecipes: EnrichedExtractionRecipe[]
  itemName: string
}

export function ItemIndividualObtainPageView({
  craftingRecipes,
  extractionRecipes,
  itemName
}: ItemIndividualObtainPageViewProps) {
  const totalRecipes = craftingRecipes.length + extractionRecipes.length

  return (
    <div className="space-y-6">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>How to Obtain {itemName}</h2>
        {totalRecipes === 0 ? (
          <p className="text-muted-foreground">
            No recipes found that produce this item. This item may be obtained through other means such as rewards,
            trading, or special events.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Found {totalRecipes} recipe{totalRecipes !== 1 ? 's' : ''} that produce this item.
          </p>
        )}
      </div>

      {totalRecipes > 0 && (
        <ItemObtainRecipesTable craftingRecipes={craftingRecipes} extractionRecipes={extractionRecipes} />
      )}
    </div>
  )
}
