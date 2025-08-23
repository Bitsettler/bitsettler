'use client';

import { useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCalculatorState } from '@/features/calculator/core';
import { CalculatorUI } from '@/features/calculator/CalculatorUI';
import { convertMaterialsToSeedItems, generateProjectTitle } from '@/lib/projectSeed';
import type { ProjectSeedItem } from '@/lib/projectSeed';
import { Calculator, ArrowRight, Package } from 'lucide-react';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';
import { ItemBadge } from '@/components/depv2/ItemBadge';
import ItemPicker from '@/components/depv2/ItemPicker';
import Image from 'next/image';

export default function AutoGenerateStep({
  onBack,
  onUse,
}: {
  onBack: () => void;
  onUse: (seed: { title: string; items: ProjectSeedItem[] }) => void;
}) {
  const calc = useCalculatorState();

  // Check if we have valid data to proceed
  const disabled = !calc.selectedItemName || !calc.qty || calc.qty <= 0 || calc.materialRows.length === 0;
  const hasResults = calc.materialRows.length > 0;

  // Memoize expensive calculations
  const totalItems = useMemo(() => calc.materialRows.length, [calc.materialRows.length]);
  const totalQuantity = useMemo(() => 
    calc.materialRows.reduce((sum, item) => sum + item.qty, 0), 
    [calc.materialRows]
  );

  const handleUse = useCallback(async () => {
    if (disabled) return;

    // Convert calculator materials to project seed items
    // Use materialRows instead of flatMaterials to include all calculated materials
    const items = convertMaterialsToSeedItems(calc.materialRows.map(row => ({
      itemId: row.id,
      name: row.name,
      qty: row.qty,
      tier: row.tier,
      skill: row.skill
    })));
    const title = generateProjectTitle(calc.selectedItemName, calc.qty);

    onUse({
      title,
      items,
    });
  }, [disabled, calc.materialRows, calc.selectedItemName, calc.qty, onUse]);



  return (
    <div className="space-y-6 pb-32">
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
                            {/* Simplified Calculator UI - only item search and quantity */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="search" className="text-sm font-medium">
                          Search for any item
                        </Label>
                        <div className="flex gap-2 mt-2">
                          <div className="flex-1">
                            <ItemPicker 
                              onChange={(id) => calc.setItemId(id)} 
                              value={calc.itemId} 
                            />
                          </div>
                          <Button variant="secondary" className="shrink-0">
                            ⌘K
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="qty" className="text-sm font-medium">
                          How many?
                        </Label>
                        <Input
                          id="qty"
                          type="number"
                          min={1}
                          value={calc.qty}
                          onChange={(e) => calc.setQty(parseInt(e.target.value) || 1)}
                          className="h-10 mt-2"
                        />
                      </div>
                    </div>
                  </div>
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
            <div className="grid gap-2 max-h-80 overflow-y-auto">
              {calc.materialRows.slice(0, 8).map((material, index) => {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded border"
                  >
                    <div className="flex items-center gap-3">
                      {material.id ? (
                        <ItemBadge id={material.id} showQuantity={false} />
                      ) : (
                        <div className="relative h-8 w-8 flex-shrink-0 rounded bg-muted border">
                          <Image
                            src={'/assets/Unknown.webp'}
                            alt={material.name}
                            fill
                            sizes="32px"
                            className="object-contain p-1"
                          />
                        </div>
                      )}
                      <span className="text-sm font-medium">{material.name}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold">
                      {material.qty?.toLocaleString()}x
                    </span>
                  </div>
                );
              })}
              {calc.materialRows.length > 8 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ... and {calc.materialRows.length - 8} more items
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

      {/* Sticky Footer - matches calculator page style */}
      <div className="sticky bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border/40 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-sm text-muted-foreground">
            {hasResults ? (
              <>
                Ready to create project: <strong className="text-foreground">{calc.selectedItemName} x {calc.qty}</strong>
              </>
            ) : (
              'Select an item to continue'
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="min-w-[80px]">
              Back
            </Button>
            <Button 
              onClick={handleUse} 
              disabled={disabled}
              className="min-w-[140px] bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              Use these items
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
