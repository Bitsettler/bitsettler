import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CraftingRecipeDesc, ExtractionRecipeDesc, ItemDesc } from '@/data/bindings'
import { Link } from '@/i18n/navigation'
import { getCraftingRecipesByItemId } from '@/lib/spacetime-db-new/modules/crafting-recipes/commands/get-crafting-recipes-by-item-id'
import { getExtractionRecipesByItemId } from '@/lib/spacetime-db-new/modules/extraction-recipes/commands/get-extraction-recipes-by-item-id'
import { createSlug, getTierColor } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getRaritiesBySlug } from '@/lib/spacetime-db-new/shared/utils/get-rarities-by-slug'
import { getRarityColor } from '@/lib/spacetime-db-new/shared/utils/rarity'

interface ItemIndividualInfoPageViewProps {
  item: ItemDesc
}

function getAllRecipesByItemId(itemId: number): {
  craftingRecipes: (CraftingRecipeDesc | ExtractionRecipeDesc)[]
  totalCount: number
} {
  const craftingRecipes = getCraftingRecipesByItemId(itemId)
  const extractionRecipes = getExtractionRecipesByItemId(itemId)

  // Combine both types as "crafting recipes" for UI
  const allRecipes = [...craftingRecipes, ...extractionRecipes]

  return {
    craftingRecipes: allRecipes,
    totalCount: allRecipes.length
  }
}

export function ItemIndividualInfoPageView({ item }: ItemIndividualInfoPageViewProps) {
  const tierColor = getTierColor(item.tier)
  const tagSlug = item.tag.toLowerCase().replace(/\s+/g, '-')
  const itemSlug = createSlug(item.name)
  const availableRarities = getRaritiesBySlug(itemSlug)

  // Get recipe data for crafting summary
  const recipeData = getAllRecipesByItemId(item.id)

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none -scroll-m-40">
      {/* Item Description Section */}
      {item.description && (
        <div className="">
          <h2 className="mt-0">Description</h2>
          <p className="text-lg leading-relaxed">{item.description}</p>
        </div>
      )}

      <h2>Properties</h2>

      {/* Properties Card */}
      <Card className="max-w-lg">
        <CardContent>
          <div className="space-y-0">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Tier</span>
              <Badge variant="outline" className={tierColor}>
                {item.tier > 0 ? item.tier : 'None'}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Rarity</span>
              <div className="flex flex-wrap gap-1">
                {availableRarities.map((rarity) => {
                  const rarityColorClass = getRarityColor(rarity.toLowerCase())
                  return (
                    <Badge key={rarity} variant="outline" className={`${rarityColorClass} capitalize`}>
                      {rarity.toLowerCase()}
                    </Badge>
                  )
                })}
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Category</span>
              <Link href={`/compendium/${tagSlug}`} className="text-primary text-sm hover:underline">
                {item.tag}
              </Link>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Volume</span>
              <span className="text-muted-foreground text-sm">{item.volume}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Durability</span>
              <span className="text-muted-foreground text-sm">{item.durability > 0 ? item.durability : 'None'}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Converts to on break</span>
              <span className="text-muted-foreground text-sm">
                {item.convertToOnDurabilityZero > 0 ? `Item #${item.convertToOnDurabilityZero}` : 'None'}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Secondary Knowledge</span>
              <span className="text-muted-foreground text-sm">
                {item.secondaryKnowledgeId > 0 ? `Knowledge #${item.secondaryKnowledgeId}` : 'None'}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Model Asset</span>
              <span
                className="text-muted-foreground max-w-32 truncate text-right text-sm"
                title={item.modelAssetName || 'None'}
              >
                {item.modelAssetName || 'None'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crafting Summary Section */}
      {recipeData.totalCount > 0 && (
        <>
          <h2>Crafting Summary</h2>
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-lg">Recipe Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">Crafting Recipes</span>
                  <Badge variant="secondary">{recipeData.totalCount}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
