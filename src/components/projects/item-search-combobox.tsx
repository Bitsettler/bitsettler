'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows/get-calculator-game-data';
import { useMemo } from 'react';

interface ItemSearchComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  onItemSelect?: (item: GameItem) => void;
  placeholder?: string;
  className?: string;
}

const DEFAULT_ICON_PATH = '/icons/items/Unknown';

function getTierColor(tier: number): string {
  const colors = {
    1: 'bg-gray-100 text-gray-800 border-gray-300',
    2: 'bg-green-100 text-green-800 border-green-300',
    3: 'bg-blue-100 text-blue-800 border-blue-300',
    4: 'bg-purple-100 text-purple-800 border-purple-300',
    5: 'bg-orange-100 text-orange-800 border-orange-300',
    6: 'bg-red-100 text-red-800 border-red-300'
  };
  return colors[tier as keyof typeof colors] || colors[1];
}

export function ItemSearchCombobox({
  value,
  onValueChange,
  onItemSelect,
  placeholder = "Search items...",
  className
}: ItemSearchComboboxProps) {
  // Get all items from the calculator data
  const gameData = useMemo(() => getCalculatorGameData(), []);
  
  // Convert items to combobox options
  const itemOptions = useMemo(() => {
    return gameData.items
      // Filter out duplicates by name
      .filter((item, index, array) => {
        const normalizedName = item.name.toLowerCase().trim();
        return array.findIndex(i => i.name.toLowerCase().trim() === normalizedName) === index;
      })
      // Convert to combobox format
      .map((item): ComboboxOption => ({
        value: item.slug,
        label: item.name,
        keywords: `${item.name} ${item.slug} ${item.category} ${item.rarity}`,
        id: item.id,
        tier: item.tier,
        category: item.category,
        rarity: item.rarity,
        icon_asset_name: item.icon_asset_name
      }))
      // Sort by name for better UX
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [gameData.items]);

  const renderOption = (option: ComboboxOption) => (
    <div className="flex w-full items-center gap-2">
      <Image
        src={option.icon_asset_name ?? `${DEFAULT_ICON_PATH}.webp`}
        alt={option.label}
        width={32}
        height={32}
        className="flex-shrink-0 rounded"
        style={{ width: 'auto', height: 'auto' }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = `${DEFAULT_ICON_PATH}.webp`;
        }}
      />
      <div className="flex min-w-0 flex-col justify-center gap-y-1">
        <div className="truncate font-medium">{option.label}</div>
        <div className="flex items-center gap-1">
          {option.tier !== -1 && (
            <Badge variant="outline" className={getTierColor(option.tier || 1)}>
              Tier {option.tier}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700"
          >
            {option.category}
          </Badge>
        </div>
      </div>
    </div>
  );

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
    
    // If callback provided, pass the full item data
    if (onItemSelect) {
      const selectedOption = itemOptions.find(option => option.value === newValue);
      if (selectedOption) {
        const fullItem = gameData.items.find(item => item.id === selectedOption.id);
        onItemSelect(fullItem);
      }
    }
  };

  return (
    <Combobox
      options={itemOptions}
      value={value || ''}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Search items by name..."
      emptyText="No items found."
      className={className}
      renderOption={renderOption}
    />
  );
}