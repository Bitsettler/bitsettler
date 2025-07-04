"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import data
import recipes from "@/src/data/recipes.json";
import roughWoodLog from "@/src/data/items/rough-wood-log.json";
import roughWoodTrunk from "@/src/data/cargo/rough-wood-trunk.json";
import matureOakTree from "@/src/data/resources/mature-oak-tree.json";

interface ItemData {
  label: string;
  tier: number;
  rarity: string;
  category: string;
  quantity?: number;
  recipes?: any[];
  selectedRecipe?: any;
  itemSlug?: string;
}

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case "common":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "uncommon":
      return "bg-green-100 text-green-800 border-green-300";
    case "rare":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "epic":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "legendary":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getTierColor = (tier: number) => {
  switch (tier) {
    case 1:
      return "bg-gray-100 text-gray-800 border-gray-300";
    case 2:
      return "bg-green-100 text-green-800 border-green-300";
    case 3:
      return "bg-blue-100 text-blue-800 border-blue-300";
    case 4:
      return "bg-purple-100 text-purple-800 border-purple-300";
    case 5:
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export const ItemNode = memo(({ id, data }: NodeProps & { data: ItemData }) => {
  const itemData = data;
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();

  const handleRecipeSelect = (recipeId: string) => {
    // Use imported data
    const items = [
      { ...roughWoodLog, slug: "rough-wood-log" },
      { ...roughWoodTrunk, slug: "rough-wood-trunk" },
      { ...matureOakTree, slug: "mature-oak-tree" },
    ];

    const recipe = recipes.find((r) => r.id.toString() === recipeId);
    if (!recipe) return;

    // Update the current node with selected recipe
    const updatedNodes = getNodes().map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            selectedRecipe: recipe,
          },
        };
      }
      return node;
    });

    console.log({ updatedNodes });

    // Remove existing material nodes and edges for this specific recipe
    const filteredNodes = updatedNodes.filter((node) => {
      // Keep the current node
      if (node.id === id) return true;
      // Remove only material nodes that belong to this specific recipe
      if (node.id.includes(`-${recipe.id}`)) return false;
      // Keep all other nodes (including parent nodes)
      return true;
    });

    const filteredEdges = getEdges().filter((edge) => {
      // Remove only edges that belong to this specific recipe
      // The edge ID format is: e{source}-{material}-{recipeId}
      // We only want to remove edges that end with -{recipeId}
      return !edge.id.endsWith(`-${recipe.id}`);
    });

    // Only create material nodes if the recipe has materials
    if (
      recipe.requirements.materials &&
      recipe.requirements.materials.length > 0
    ) {
      // Create material nodes
      const materialNodes: any[] = recipe.requirements.materials.map(
        (material: string, index: number) => {
          const materialData = items.find((item) => item.slug === material);

          // Check if this material has recipes (for recursive expansion)
          const materialRecipes = recipes.filter((r) =>
            r.output.some((output) => output.item === material)
          );

          return {
            id: `${material}_${recipe.id}`,
            type: materialRecipes.length > 0 ? "itemNode" : "materialNode",
            data: {
              label: materialData?.name || material,
              tier: materialData?.tier || 1,
              rarity: materialData?.rarity || "common",
              category: materialData?.category || "unknown",
              quantity: 1,
              recipes: materialRecipes, // Pass recipes if available
              selectedRecipe: null,
              itemSlug: material,
            },
            position: {
              x: 100 + index * 200,
              y: 300,
            },
          };
        }
      );

      // Create edges connecting main item to materials
      const materialEdges: any[] = recipe.requirements.materials.map(
        (material: string, index: number) => ({
          id: `${id}-${material}_${recipe.id}`,
          source: id,
          target: `${material}_${recipe.id}`,
          type: "smoothstep",
        })
      );

      console.log("Creating material nodes:", materialNodes.length);
      console.log("Creating material edges:", materialEdges.length);
      console.log("Filtered nodes count:", filteredNodes.length);
      console.log("Filtered edges count:", filteredEdges.length);

      setNodes([...filteredNodes, ...materialNodes]);
      setEdges([...filteredEdges, ...materialEdges]);
    } else {
      // For gathering recipes without materials, just update the node
      setNodes([...filteredNodes]);
      setEdges([...filteredEdges]);
    }
  };

  return (
    <Card className="w-64 shadow-lg border-2 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {itemData.label}
          </CardTitle>
          {itemData.quantity && (
            <Badge variant="secondary" className="text-xs">
              Qty: {itemData.quantity}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge
            variant="outline"
            className={`text-xs ${getTierColor(itemData.tier)}`}
          >
            Tier {itemData.tier}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${getRarityColor(itemData.rarity)}`}
          >
            {itemData.rarity}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
          >
            {itemData.category}
          </Badge>
        </div>

        {itemData.recipes && itemData.recipes.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-medium mb-1">
              Select Recipe ({itemData.recipes.length} available):
            </div>
            <Select
              value={itemData.selectedRecipe?.id?.toString() || ""}
              onValueChange={handleRecipeSelect}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choose recipe..." />
              </SelectTrigger>
              <SelectContent>
                {itemData.recipes.map((recipe: any) => (
                  <SelectItem key={recipe.id} value={recipe.id.toString()}>
                    {recipe.name || `Recipe #${recipe.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(!itemData.recipes || itemData.recipes.length === 0) && (
          <div className="mt-2 text-xs text-muted-foreground">
            No recipes available for this item
          </div>
        )}

        {itemData.selectedRecipe && (
          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
            <div className="font-medium mb-1">Selected Recipe:</div>
            <div>
              Profession: {itemData.selectedRecipe.requirements.professions}
            </div>
            <div>Building: {itemData.selectedRecipe.requirements.building}</div>
            <div>Tool: {itemData.selectedRecipe.requirements.tool}</div>
          </div>
        )}
      </CardContent>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
    </Card>
  );
});

export const MaterialNode = memo(({ data }: NodeProps & { data: ItemData }) => {
  const itemData = data;
  return (
    <Card className="w-48 shadow-md border border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {itemData.label}
          </CardTitle>
          {itemData.quantity && (
            <Badge variant="secondary" className="text-xs">
              {itemData.quantity}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1">
          <Badge
            variant="outline"
            className={`text-xs ${getTierColor(itemData.tier)}`}
          >
            T{itemData.tier}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${getRarityColor(itemData.rarity)}`}
          >
            {itemData.rarity}
          </Badge>
        </div>
      </CardContent>

      <Handle type="target" position={Position.Top} className="w-3 h-3" />
    </Card>
  );
});

ItemNode.displayName = "ItemNode";
MaterialNode.displayName = "MaterialNode";
