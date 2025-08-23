'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCalculatorState } from '@/features/calculator/core';
import { CalculatorUI } from '@/features/calculator/CalculatorUI';
import { convertMaterialsToSeedItems, generateProjectTitle } from '@/lib/projectSeed';
import type { ProjectSeedItem } from '@/lib/projectSeed';
import { Calculator, ArrowRight, Package } from 'lucide-react';

export default function AutoGenerateStep({
  onBack,
  onUse,
}: {
  onBack: () => void;
  onUse: (seed: { title: string; items: ProjectSeedItem[] }) => void;
}) {
  const calc = useCalculatorState();

  // Check if we have valid data to proceed
  const disabled = !calc.selectedItemName || !calc.qty || calc.qty <= 0 || calc.flatMaterials.length === 0;
  const hasResults = calc.flatMaterials.length > 0;

  async function handleUse() {
    if (disabled) return;

    // Convert calculator materials to project seed items
    const items = convertMaterialsToSeedItems(calc.materialRows);
    const title = generateProjectTitle(calc.selectedItemName, calc.qty);

    onUse({
      title,
      items,
    });
  }

  // Calculate totals for display
  const totalItems = calc.flatMaterials.length;
  const totalQuantity = calc.flatMaterials.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="space-y-6">
      {/* Calculator UI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculator
          </CardTitle>
          <CardDescription>
            Select an item and quantity to generate a complete materials list for your project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CalculatorUI {...calc.uiProps} />
        </CardContent>
      </Card>

      {/* Results Preview */}
      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materials Preview
            </CardTitle>
            <CardDescription>
              {totalItems} unique items, {totalQuantity} total quantity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {calc.flatMaterials.slice(0, 10).map((material, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{material.name}</span>
                    {material.tier && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        Tier {material.tier}
                      </span>
                    )}
                    {material.skill && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded dark:bg-blue-900/20 dark:text-blue-400">
                        {material.skill}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-sm">{material.qty}x</span>
                </div>
              ))}
              {calc.flatMaterials.length > 10 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ... and {calc.flatMaterials.length - 10} more items
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!hasResults && (
        <Alert>
          <Calculator className="h-4 w-4" />
          <AlertDescription>
            Select an item and enter a quantity above to see the materials needed for your project.
          </AlertDescription>
        </Alert>
      )}

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-t rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasResults ? (
              <>
                Ready to create project: <strong>{calc.selectedItemName} x {calc.qty}</strong>
              </>
            ) : (
              'Select an item to continue'
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={handleUse} disabled={disabled}>
              Use these items
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
