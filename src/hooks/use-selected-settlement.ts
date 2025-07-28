'use client';

import { useState, useEffect } from 'react';
import { generateSettlementInviteCode } from '../lib/utils/invite-codes';

export interface Settlement {
  id: string;
  name: string;
  tier: number;
  treasury: number;
  supplies: number;
  tiles: number;
  population: number;
}

export interface SettlementInviteCode {
  code: string;
  formattedCode: string;
  createdAt: string;
  settlementId: string;
  settlementName: string;
}

export function useSelectedSettlement() {
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [inviteCode, setInviteCode] = useState<SettlementInviteCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settlement and invite code from localStorage on mount
  useEffect(() => {
    const storedSettlement = localStorage.getItem('selectedSettlement');
    const storedInviteCode = localStorage.getItem('settlementInviteCode');
    
    if (storedSettlement) {
      try {
        const settlement = JSON.parse(storedSettlement);
        setSelectedSettlement(settlement);
        
        // Load existing invite code or generate new one
        if (storedInviteCode) {
          try {
            const existingCode = JSON.parse(storedInviteCode);
            // Verify the invite code matches the current settlement
            if (existingCode.settlementId === settlement.id) {
              setInviteCode(existingCode);
            } else {
              // Generate new code for different settlement
              const newCode = generateSettlementInviteCode(settlement.id, settlement.name);
              setInviteCode(newCode);
              localStorage.setItem('settlementInviteCode', JSON.stringify(newCode));
            }
          } catch (codeError) {
            // Generate new code if stored code is invalid
            const newCode = generateSettlementInviteCode(settlement.id, settlement.name);
            setInviteCode(newCode);
            localStorage.setItem('settlementInviteCode', JSON.stringify(newCode));
          }
        } else {
          // Generate new invite code for first time
          const newCode = generateSettlementInviteCode(settlement.id, settlement.name);
          setInviteCode(newCode);
          localStorage.setItem('settlementInviteCode', JSON.stringify(newCode));
        }
      } catch (error) {
        console.error('Error parsing stored settlement:', error);
        // Clear invalid data
        localStorage.removeItem('selectedSettlement');
        localStorage.removeItem('settlementInviteCode');
      }
    }
    setIsLoading(false);
  }, []);

  // Function to select a new settlement
  const selectSettlement = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    localStorage.setItem('selectedSettlement', JSON.stringify(settlement));
    
    // Generate new invite code for the selected settlement
    const newCode = generateSettlementInviteCode(settlement.id, settlement.name);
    setInviteCode(newCode);
    localStorage.setItem('settlementInviteCode', JSON.stringify(newCode));
  };

  // Function to regenerate invite code
  const regenerateInviteCode = () => {
    if (!selectedSettlement) return null;
    
    const newCode = generateSettlementInviteCode(selectedSettlement.id, selectedSettlement.name);
    setInviteCode(newCode);
    localStorage.setItem('settlementInviteCode', JSON.stringify(newCode));
    
    return newCode;
  };

  // Function to clear the selected settlement
  const clearSettlement = () => {
    setSelectedSettlement(null);
    setInviteCode(null);
    localStorage.removeItem('selectedSettlement');
    localStorage.removeItem('settlementInviteCode');
  };

  // Function to get just the settlement ID (most common use case)
  const getSettlementId = (): string | null => {
    return selectedSettlement?.id || null;
  };

  return {
    selectedSettlement,
    inviteCode,
    isLoading,
    selectSettlement,
    regenerateInviteCode,
    clearSettlement,
    getSettlementId,
    hasSettlement: !!selectedSettlement
  };
} 