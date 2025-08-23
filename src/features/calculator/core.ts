/**
 * Calculator core logic extracted for reuse between calculator page and project wizard
 * This module re-exports existing calculator functions and provides a lightweight state hook
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getItemById } from '@/lib/depv2/indexes';
import { findDeepCraftables } from '@/lib/depv2/itemIndex';
import { getItemDisplay } from '@/lib/depv2/display';
import { expandToBase } from '@/lib/depv2/engine';
import type { MaterialRow } from '@/components/depv2/types';

// Re-export types for external use
export type FlatMaterial = {
  itemId?: string;
  itemSlug?: string;
  name: string;
  qty: number;
  skill?: string | null;
  tier?: number | null;
};

/**
 * Pure compute function - calculates flattened materials from item and quantity
 * Re-uses existing expandToBase logic from depv2 engine
 */
export async function calculateFlattenedMaterials(input: {
  itemId?: string;
  itemSlug?: string;
  qty: number;
  options?: { groupBy?: 'skill' | 'tier' | 'flat' };
}): Promise<FlatMaterial[]> {
  if (!input.itemId) {
    return [];
  }

  try {
    const result = expandToBase(input.itemId, input.qty, false);
    const materials: FlatMaterial[] = [];

    // Convert the totals map to our FlatMaterial format
    for (const [itemId, qty] of result.totals) {
      const item = getItemById(itemId);
      if (item) {
        const display = getItemDisplay(item);
        materials.push({
          itemId,
          name: display.name,
          qty,
          skill: display.skill || null,
          tier: display.tier || null,
        });
      }
    }

    return materials;
  } catch (error) {
    console.error('Error calculating flattened materials:', error);
    return [];
  }
}

/**
 * Lightweight calculator state hook for use in both calculator page and project wizard
 * Provides the essential state and UI components needed for item selection and calculation
 */
export function useCalculatorState() {
  const [itemId, setItemId] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [debouncedQty, setDebouncedQty] = useState<number>(1);
  const [groupBy, setGroupBy] = useState<'skill' | 'tier' | 'none'>('skill');
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [deepCraftables, setDeepCraftables] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize deep craftables on mount
  useEffect(() => {
    if (!isInitialized) {
      const craftables = findDeepCraftables();
      setDeepCraftables(craftables);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Debounce quantity changes to prevent excessive calculations
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQty(qty);
    }, 300);
    return () => clearTimeout(timer);
  }, [qty]);

  // Calculate materials when itemId or debouncedQty changes
  const materialRows = useMemo(() => {
    if (!itemId || debouncedQty <= 0) return [];

    try {
      const result = expandToBase(itemId, debouncedQty, false);
      const rows: MaterialRow[] = [];

      // Check if totals is a Map and iterate properly
      if (result.totals && typeof result.totals.entries === 'function') {
        const itemsMap = getItemById(); // Get the items Map once
        
        // Limit to first 50 items for performance
        let count = 0;
        for (const [id, quantity] of result.totals.entries()) {
          if (count >= 50) break;
          
          const item = itemsMap.get(id); // Get specific item from Map
          if (item) {
            const display = getItemDisplay(item.id);
            rows.push({
              id,
              name: display.name,
              qty: quantity,
              tier: display.tier,
              skill: display.skill,
              iconSrc: display.iconSrc,
            });
            count++;
          }
        }
      }
      return rows;
    } catch (error) {
      console.error('Error calculating materials:', error);
      return [];
    }
  }, [itemId, debouncedQty]);

  // Update calculating state when materials are being computed
  useEffect(() => {
    if (itemId && qty > 0) {
      setIsCalculating(true);
      // Small delay to show loading state, but shorter for better performance
      const timer = setTimeout(() => setIsCalculating(false), 50);
      return () => clearTimeout(timer);
    } else {
      setIsCalculating(false);
    }
  }, [itemId, qty]);

  // Flat materials for external use
  const flatMaterials = useMemo(() => {
    return materialRows
      .filter(row => row.id != null) // Filter out rows without IDs
      .map(row => ({
        itemId: typeof row.id === 'string' ? row.id : row.id!.toString(),
        name: row.name,
        qty: row.qty,
        skill: row.skill || null,
        tier: row.tier || null,
      }));
  }, [materialRows]);

  // Get selected item info
  const selectedItem = useMemo(() => {
    if (!itemId) return null;
    
    // getItemById() returns the entire Map, we need to get the specific item
    const itemsMap = getItemById();
    const item = itemsMap.get(itemId);
    
    if (!item) {
      return null;
    }
    
    const display = getItemDisplay(item.id);
    return display;
  }, [itemId]);

  const selectedItemName = selectedItem?.name || '';

  // Handle random item selection
  const handleRandomDeepItem = () => {
    if (deepCraftables.length > 0) {
      const randomIndex = Math.floor(Math.random() * deepCraftables.length);
      const randomItemId = deepCraftables[randomIndex];
      setItemId(randomItemId);
    }
  };

  // UI component props for external rendering
  const uiProps = {
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
  };

  return {
    // State
    itemId,
    qty,
    groupBy,
    showSteps,
    isCalculating,
    selectedItemName,
    materialRows,
    flatMaterials,
    
    // Actions
    setItemId,
    setQty,
    setGroupBy,
    setShowSteps,
    handleRandomDeepItem,
    
    // UI props for external rendering
    uiProps,
  };
}
