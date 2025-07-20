import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { EnrichedCraftingRecipe } from '@/lib/spacetime-db/modules/crafting-recipes/flows'
import type { EnrichedExtractionRecipe } from '@/lib/spacetime-db/modules/extraction-recipes/flows'

interface ItemObtainRecipesTableProps {
  craftingRecipes: EnrichedCraftingRecipe[]
  extractionRecipes: EnrichedExtractionRecipe[]
}

export function ItemObtainRecipesTable({ craftingRecipes, extractionRecipes }: ItemObtainRecipesTableProps) {
  const allRecipes = [
    ...craftingRecipes.map((recipe) => ({ ...recipe, type: 'crafting' as const })),
    ...extractionRecipes.map((recipe) => ({ ...recipe, type: 'extraction' as const }))
  ]

  if (allRecipes.length === 0) {
    return <div className="text-muted-foreground py-8 text-center">No recipes found that produce this item.</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
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
              <TableCell>
                <Badge variant={recipe.type === 'crafting' ? 'default' : 'secondary'}>
                  {recipe.type === 'crafting' ? 'Crafting' : 'Extraction'}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {recipe.type === 'crafting' ? recipe.name : recipe.recipeName}
              </TableCell>
              <TableCell>
                {recipe.type === 'crafting' ? (
                  <>
                    {recipe.resolvedBuildingType?.name || 'Hand Crafted'}
                    {recipe.buildingRequirement && (
                      <div className="text-muted-foreground text-xs">Tier {recipe.buildingRequirement.tier}</div>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {recipe.verbPhrase} Resource
                    {recipe.range > 1 && <div className="text-xs">Range: {recipe.range}</div>}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {recipe.allowUseHands && recipe.enrichedToolRequirements.length === 0 ? (
                  <span className="text-muted-foreground">Hands</span>
                ) : (
                  <div className="space-y-1">
                    {recipe.enrichedToolRequirements.map((toolReq, index) => (
                      // @TODO: fix this
                      <div key={index} className="text-sm">
                        {/* {toolReq.tool?.name || `Tool Type ${toolReq.toolType}`}
                        <span className="text-muted-foreground ml-1">(Level {toolReq.level})</span> */}
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
                        {levelReq.profession?.name || `Skill ${levelReq.skillId}`}
                        <span className="text-muted-foreground ml-1">Level {levelReq.level}</span>
                      </div>
                    )
                  })}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {recipe.enrichedConsumedItems.map((item, index) => (
                    <div key={index} className="text-sm">
                      {item.quantity}x {item.item?.name || `Item ${item.itemId}`}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {recipe.type === 'crafting'
                    ? recipe.enrichedCraftedItems.map((item, index) => (
                        <div key={index} className="text-sm font-medium">
                          {item.quantity}x {item.item?.name || `Item ${item.itemId}`}
                        </div>
                      ))
                    : recipe.enrichedExtractedItems.map((item, index) => (
                        <div key={index} className="text-sm font-medium">
                          {item.quantity}x {item.item?.name || `Item ${item.itemId}`}
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
                  {recipe.timeRequirement}s
                  {recipe.type === 'crafting' && recipe.actionsRequired > 1 && (
                    <div className="text-muted-foreground text-xs">{recipe.actionsRequired} actions</div>
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
