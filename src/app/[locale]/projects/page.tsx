"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemNode, MaterialNode } from "@/components/recipe-nodes";

import recipes from "@/src/data/recipes.json";
import roughWoodLog from "@/src/data/items/rough-wood-log.json";
import roughWoodTrunk from "@/src/data/cargo/rough-wood-trunk.json";

const items = [roughWoodLog, roughWoodTrunk];

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  console.log({ nodes, edges });

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const handleItemSelect = useCallback(
    (item: any) => {
      setSelectedItem(item);
      setSearchTerm("");

      // Find recipes for this specific item
      const itemRecipes = recipes.filter((recipe) =>
        recipe.output.some((output) => output.item === item.slug),
      );

      // Create the main item node
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
          itemSlug: item.slug, // Add this to identify the item
        },
        position: { x: 250, y: 100 },
      };

      setNodes([itemNode]);
      setEdges([]);
    },
    [setNodes, setEdges],
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search for items..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search Results */}
            {filteredItems.length > 0 && (
              <div className="mt-4 space-y-2">
                {filteredItems.map((item) => (
                  <Button
                    key={item.slug}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleItemSelect(item)}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* React Flow Canvas */}
        <Card className="h-[600px]">
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
              <Controls />
              <Background />
            </ReactFlow>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
