"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
} from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemNode, MaterialNode } from "@/components/recipe-nodes";
import { Container } from "@/components/container";
import { useTranslations } from "next-intl";
import { Combobox } from "@/components/ui/combobox";

import recipes from "@/src/data/recipes.json";
import roughWoodLog from "@/src/data/items/rough-wood-log.json";
import roughWoodTrunk from "@/src/data/cargo/rough-wood-trunk.json";
import matureOakTree from "@/src/data/resources/mature-oak-tree.json";

// All available items in the database
const allItems = [
  { ...roughWoodLog, slug: "rough-wood-log" },
  { ...roughWoodTrunk, slug: "rough-wood-trunk" },
  { ...matureOakTree, slug: "mature-oak-tree" },
];

// Convert items to combobox options
const itemOptions = allItems.map((item) => ({
  value: item.slug,
  label: item.name,
}));

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();

  const getLayoutedElements = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();

    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: "TB",
      ranker: "longest-path",
      align: "UL",
      nodesep: 100,
      ranksep: 100,
    });

    edges.forEach((edge) => g.setEdge(edge.source, edge.target));
    nodes.forEach((node) =>
      g.setNode(node.id, {
        width: node.measured?.width ?? 320,
        height: node.measured?.height ?? 120,
      })
    );

    Dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
      const position = g.node(node.id);
      return {
        ...node,
        position: {
          x: position.x - (node.measured?.width ?? 0) / 2,
          y: position.y - (node.measured?.height ?? 0) / 2,
        },
      };
    });

    setNodes(layoutedNodes);
    fitView();
  }, [getNodes, getEdges, setNodes, fitView]);

  return { getLayoutedElements };
};

function HomeFlow() {
  const t = useTranslations();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [desiredQuantity, setDesiredQuantity] = useState(1);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { getLayoutedElements } = useLayoutedElements();

  // Apply layout whenever nodes or edges change
  useEffect(() => {
    if (nodes.length > 1 || edges.length > 0) {
      setTimeout(() => getLayoutedElements(), 0);
    }
  }, [nodes.length, edges.length, getLayoutedElements]);

  // Update node quantities when desired quantity changes
  useEffect(() => {
    if (nodes.length > 0 && selectedItem) {
      updateNodeQuantities(desiredQuantity);
    }
  }, [desiredQuantity, selectedItem]);

  const updateNodeQuantities = useCallback(
    (targetQuantity: number) => {
      const updatedNodes = nodes.map((node) => {
        if (node.id === selectedItem.slug) {
          // Update main item quantity
          return {
            ...node,
            data: {
              ...node.data,
              quantity: targetQuantity,
            },
          };
        } else {
          // For all other nodes, calculate quantities based on their recipe
          const recipe = node.data.selectedRecipe as any;
          if (recipe) {
            // Find the output item that matches the selected item
            const outputItem = recipe.output?.find(
              (output: any) => output.item === selectedItem.slug
            );

            if (outputItem) {
              const outputQty = Array.isArray(outputItem.qty)
                ? outputItem.qty[0] // Use minimum quantity for calculation
                : outputItem.qty || 1;

              // Calculate how many times we need to run this recipe
              const recipeRuns = Math.ceil(targetQuantity / outputQty);

              return {
                ...node,
                data: {
                  ...node.data,
                  quantity: recipeRuns,
                },
              };
            }
          }
        }
        return node;
      });

      // Now update material nodes based on recipe requirements
      const finalNodes = updatedNodes.map((node) => {
        // Check if this is a material node (has recipe ID in its ID)
        if (node.id.includes("_") && node.id !== selectedItem.slug) {
          const [materialSlug, recipeId] = node.id.split("_");
          const recipe = recipes.find((r: any) => r.id.toString() === recipeId);

          if (recipe) {
            // Find the material requirement
            const materialReq = recipe.requirements.materials?.find(
              (mat: any) => {
                if (typeof mat === "string") {
                  return mat === materialSlug;
                } else {
                  return mat.slug === materialSlug;
                }
              }
            );

            if (materialReq) {
              // Get the quantity needed per recipe run
              const materialQty =
                typeof materialReq === "string" ? 1 : materialReq.qty;

              // Only calculate quantities if the material has a specific quantity requirement
              // and is not a resource (resources don't show quantities)
              if (
                materialQty !== null &&
                materialQty !== undefined &&
                node.data.category !== "resources"
              ) {
                // Find the parent recipe node to get how many times we need to run it
                const parentNode = updatedNodes.find(
                  (n) => n.id === selectedItem.slug
                );
                if (parentNode && parentNode.data.selectedRecipe) {
                  const parentRecipe = parentNode.data.selectedRecipe as any;
                  const outputItem = parentRecipe.output?.find(
                    (output: any) => output.item === selectedItem.slug
                  );

                  if (outputItem) {
                    const outputQty = Array.isArray(outputItem.qty)
                      ? outputItem.qty[0]
                      : outputItem.qty || 1;

                    const recipeRuns = Math.ceil(targetQuantity / outputQty);
                    const totalMaterialQty = recipeRuns * materialQty;

                    return {
                      ...node,
                      data: {
                        ...node.data,
                        quantity: totalMaterialQty,
                      },
                    };
                  }
                }
              } else {
                // For resources or items without quantity requirements, remove the quantity
                return {
                  ...node,
                  data: {
                    ...node.data,
                    quantity: undefined,
                  },
                };
              }
            }
          }
        }
        return node;
      });

      setNodes(finalNodes);
    },
    [nodes, selectedItem, setNodes]
  );

  console.log({ nodes, edges });

  const handleItemSelect = useCallback(
    (itemSlug: string) => {
      const item = allItems.find((item: any) => item.slug === itemSlug);
      if (!item) return;

      setSelectedItem(item);
      setDesiredQuantity(1); // Reset quantity when selecting new item

      // Find recipes for this specific item
      const itemRecipes = recipes.filter((recipe) =>
        recipe.output.some((output) => output.item === item.slug)
      );

      // Create only the main item node initially
      const itemNode: Node = {
        id: item.slug,
        type: "itemNode",
        data: {
          label: item.name,
          tier: item.tier,
          rarity: item.rarity,
          category: item.category,
          recipes: itemRecipes,
          selectedRecipe: null,
          itemSlug: item.slug,
          quantity: 1,
        },
        position: { x: 0, y: 0 }, // Will be positioned by dagre
      };

      // Set the node and apply layout
      setNodes([itemNode]);
      setEdges([]);
      setTimeout(() => getLayoutedElements(), 0);
    },
    [setNodes, setEdges, getLayoutedElements]
  );

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-100px)]">
          {/* Left Column - Title, Search and Info Section (3 columns) */}
          <div className="col-span-3 space-y-4">
            {/* Title and Subtitle */}
            <div className="text-left">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t("header.title")}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("header.subtitle")}
              </p>
            </div>

            {/* Search Card */}
            <Card>
              <CardHeader>
                <CardTitle>Search Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Combobox
                  options={itemOptions}
                  value={selectedItem?.slug || ""}
                  onValueChange={handleItemSelect}
                  placeholder="Search for items..."
                  searchPlaceholder="Search items..."
                  emptyText="No items found."
                />
              </CardContent>
            </Card>

            {/* Item Information Card */}
            {selectedItem && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedItem.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info Section */}
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      Info
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="text-muted-foreground mt-1">
                          {selectedItem.description ||
                            "No description available"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Tier:</span>
                        <span className="text-muted-foreground ml-1">
                          {selectedItem.tier || "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Rarity:</span>
                        <span className="text-muted-foreground ml-1">
                          {selectedItem.rarity || "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Category:</span>
                        <span className="text-muted-foreground ml-1">
                          {selectedItem.category || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input Section */}
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      Crafting Quantity
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={desiredQuantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDesiredQuantity(parseInt(e.target.value) || 1)
                          }
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">
                          items to craft
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Usage Section */}
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      Usage
                    </h3>
                    <div className="space-y-2">
                      {recipes.filter((recipe) =>
                        recipe.requirements.materials?.some(
                          (material) => material === selectedItem.slug
                        )
                      ).length > 0 ? (
                        recipes
                          .filter((recipe) =>
                            recipe.requirements.materials?.some(
                              (material) => material === selectedItem.slug
                            )
                          )
                          .map((recipe, index) => (
                            <div
                              key={index}
                              className="text-sm p-2 bg-muted rounded"
                            >
                              <div className="font-medium">{recipe.name}</div>
                              <div className="text-muted-foreground text-xs">
                                Produces:{" "}
                                {recipe.output.map((output, i) => (
                                  <span key={i}>
                                    {output.qty
                                      ? Array.isArray(output.qty)
                                        ? `${output.qty[0]}-${output.qty[1]}`
                                        : output.qty
                                      : "?"}
                                    x {output.item}
                                    {i < recipe.output.length - 1 ? ", " : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          This item is not used in any recipes
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - React Flow Canvas (9 columns) */}
          <div className="col-span-9">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={{
                    itemNode: ItemNode,
                    materialNode: MaterialNode,
                  }}
                  fitView
                  className="h-full"
                >
                  <Controls className="bg-background border border-border" />
                  <Background />
                </ReactFlow>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <HomeFlow />
    </ReactFlowProvider>
  );
}
