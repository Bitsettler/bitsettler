'use client';

import { useState } from 'react';

export interface Settlement {
  id: string;
  name: string;
  tier: number;
  treasury: number;
  supplies: number;
  tiles: number;
  population: number;
}

export function useSelectedSettlement() {
  const [isLoading] = useState(false);

  const clearSettlement = () => {
    // Basic settlement clearing functionality
  };

  return {
    isLoading,
    clearSettlement
  };
} 