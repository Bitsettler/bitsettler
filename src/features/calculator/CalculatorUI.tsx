'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calculator, Search, Shuffle, Package2 } from 'lucide-react';
import ItemPicker from '@/components/depv2/ItemPicker';

interface CalculatorUIProps {
  itemId: string;
  qty: number;
  groupBy: 'skill' | 'tier' | 'none';
  showSteps: boolean;
  deepCraftables: string[];
  setItemId: (id: string) => void;
  setQty: (qty: number) => void;
  setGroupBy: (groupBy: 'skill' | 'tier' | 'none') => void;
  setShowSteps: (show: boolean) => void;
  handleRandomDeepItem: () => void;
}

export function CalculatorUI({
  itemId,
  qty,
  groupBy,
  showSteps,
  deepCraftables,
  setItemId,
  setQty,
  setGroupBy,
  setShowSteps,
  handleRandomDeepItem,
}: CalculatorUIProps) {
  return (
    <div className="space-y-6">
      {/* Search and quantity row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search for any item
          </Label>
          <div className="flex gap-2 mt-2">
            <div className="flex-1">
              <ItemPicker 
                onChange={setItemId} 
                value={itemId} 
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
          <div className="flex gap-2 mt-2">
            <Input
              id="qty"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              className="h-10"
            />
            <Button
              variant="outline"
              className="whitespace-nowrap"
              onClick={handleRandomDeepItem}
              disabled={deepCraftables.length === 0}
            >
              Try random
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Secondary controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="text-sm font-medium">Group by:</span>
          </div>
          <ToggleGroup
            type="single"
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as 'skill' | 'tier' | 'none')}
            className="gap-1"
          >
            <ToggleGroupItem value="skill" aria-label="Group by skill">
              <Search className="h-4 w-4" />
              Skill
            </ToggleGroupItem>
            <ToggleGroupItem value="tier" aria-label="Group by tier">
              <Package2 className="h-4 w-4" />
              Tier
            </ToggleGroupItem>
            <ToggleGroupItem value="none" aria-label="No grouping">
              <Shuffle className="h-4 w-4" />
              Flat
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-steps"
              checked={showSteps}
              onCheckedChange={setShowSteps}
            />
            <Label htmlFor="show-steps" className="text-sm">
              Show crafting steps
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
