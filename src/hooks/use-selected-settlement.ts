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
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

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
          } catch (error) {
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
  const selectSettlement = async (settlement: Settlement, skipSync = false) => {
    // If same settlement is already selected, skip heavy processing but allow for navigation
    if (selectedSettlement?.id === settlement.id) {
      console.log(`🎯 Settlement ${settlement.name} is already selected, skipping heavy operations.`);
      // Still allow state updates for navigation purposes
      setSelectedSettlement(settlement);
      return;
    }

    setSelectedSettlement(settlement);
    localStorage.setItem('selectedSettlement', JSON.stringify(settlement));
    
    // Generate new invite code for the selected settlement
    const newCode = generateSettlementInviteCode(settlement.id, settlement.name);
    setInviteCode(newCode);
    localStorage.setItem('settlementInviteCode', JSON.stringify(newCode));

    console.log(`🎯 Settlement selected: ${settlement.name}`);

    // Only trigger sync if not already done (prevents duplicate syncs during onboarding)
    if (!skipSync) {
      // 🚀 Trigger immediate settlement data sync for onboarding
      // This ensures the dashboard isn't empty when user completes selection
      console.log(`🎯 Settlement selected: ${settlement.name}. Triggering onboarding sync...`);
      
      try {
        const response = await fetch('/api/settlement/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'onboarding',
            mode: 'full',
            settlementId: settlement.id,
            settlementName: settlement.name,
            triggeredBy: 'user_selection'
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Onboarding sync completed for ${settlement.name}:`, {
            members: `${result.data.membersFound} found, ${result.data.membersAdded} added`,
            citizens: `${result.data.citizensFound} found, ${result.data.citizensAdded} added`,
            duration: `${result.data.syncDurationMs}ms`
          });
        } else {
          console.warn(`⚠️ Onboarding sync failed for ${settlement.name}:`, result.error);
          // Don't throw error - user can still use the app, just with delayed data
        }
      } catch (error) {
        console.warn('⚠️ Onboarding sync request failed:', error);
        // Silent fail - the scheduled sync will catch this later
      }
    } else {
      console.log(`🎯 Settlement selected: ${settlement.name}. Skipping sync (already completed).`);
    }
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

  // Function to generate invite code for any settlement ID (without full selection)
  const generateInviteCodeForSettlement = (settlementId: string, settlementName: string = 'Settlement'): SettlementInviteCode => {
    const newCode = generateSettlementInviteCode(settlementId, settlementName);
    setInviteCode(newCode);
    localStorage.setItem('settlementInviteCode', JSON.stringify(newCode));
    return newCode;
  };

  return {
    selectedSettlement,
    inviteCode,
    isLoading,
    selectSettlement,
    regenerateInviteCode,
    clearSettlement,
    getSettlementId,
    generateInviteCodeForSettlement,
    hasSettlement: !!selectedSettlement
  };
} 