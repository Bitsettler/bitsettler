'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { EnrichedCraftingRecipe } from '@/lib/spacetime-db-new/modules/crafting-recipes/flows'
import type { EnrichedExtractionRecipe } from '@/lib/spacetime-db-new/modules/extraction-recipes/flows'

interface ItemObtainRecipesTableProps {
  craftingRecipes: EnrichedCraftingRecipe[]
  extractionRecipes: EnrichedExtractionRecipe[]
}

export function ItemObtainRecipesTable({
  craftingRecipes,
  extractionRecipes
}: ItemObtainRecipesTableProps) {
  const allRecipes = [
    ...craftingRecipes.map((recipe) => ({
      ...recipe,
      type: 'crafting' as const
    })),
    ...extractionRecipes.map((recipe) => ({
      ...recipe,
      type: 'extraction' as const
    }))
  ]

  if (allRecipes.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No recipes found that produce this item.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipe</TableHead>
            <TableHead>Location/Building</TableHead>
            <TableHead>Tools Required</TableHead>
            <TableHead>Level Requirements</TableHead>
            <TableHead>Materials</TableHead>
            <TableHead>Output</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allRecipes.map((recipe) => (
            <TableRow key={`${recipe.type}-${recipe.id}`}>
              <TableCell className="font-medium">
                {recipe.type === 'crafting'
                  ? recipe.resolvedRecipeName
                  : `${recipe.verbPhrase} Recipe`}
              </TableCell>
              <TableCell>
                {recipe.type === 'crafting' ? (
                  recipe.buildingRequirement ? (
                    <div className="text-sm">
                      {recipe.resolvedBuildingType?.name ||
                        `Building ${recipe.buildingRequirement.buildingType}`}
                      <span className="text-muted-foreground ml-1">
                        (Tier {recipe.buildingRequirement.tier})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Hand Crafted
                    </span>
                  )
                ) : (
                  <div className="text-sm">
                    {recipe.resource?.name || 'Resource Node'}
                    {recipe.range > 1 && (
                      <span className="text-muted-foreground ml-1">
                        (Range: {recipe.range})
                      </span>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {recipe.allowUseHands &&
                recipe.enrichedToolRequirements.length === 0 ? (
                  <span className="text-muted-foreground">Hands</span>
                ) : (
                  <div className="space-y-1">
                    {recipe.enrichedToolRequirements.map((toolReq, index) => (
                      <div key={index} className="text-sm">
                        {toolReq.toolTypeName}
                        <span className="text-muted-foreground ml-1">
                          (Tier {toolReq.toolItem?.tier || toolReq.level})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {recipe.enrichedLevelRequirements.map((levelReq, index) => {
                    return (
                      <div key={index} className="text-sm">
                        {levelReq.skill?.name || `Skill ${levelReq.skillId}`}
                        <span className="text-muted-foreground ml-1">
                          Level {levelReq.level}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {recipe.enrichedConsumedItems.map((item, index) => (
                    <div key={index} className="text-sm">
                      {item.quantity}x{' '}
                      {item.item?.name || `Item ${item.itemId}`}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {recipe.type === 'crafting'
                    ? recipe.enrichedCraftedItems.map((item, index) => (
                        <div key={index} className="text-sm font-medium">
                          {item.quantity}x{' '}
                          {item.item?.name || `Item ${item.itemId}`}
                        </div>
                      ))
                    : recipe.enrichedExtractedItems.map((item, index) => (
                        <div key={index} className="text-sm font-medium">
                          {item.quantity}x{' '}
                          {item.item?.name ||
                            item.cargo?.name ||
                            `ID ${item.itemId}`}
                          {item.probability < 1 && (
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({Math.round(item.probability * 100)}%)
                            </span>
                          )}
                        </div>
                      ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {recipe.timeRequirement.toFixed(2)}s
                  {recipe.type === 'crafting' && recipe.actionsRequired > 1 && (
                    <div className="text-muted-foreground text-xs">
                      {recipe.actionsRequired} actions
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
