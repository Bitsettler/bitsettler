'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [inviteCode, setInviteCode] = useState<SettlementInviteCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInviteCodeFromDatabase = useCallback(async (): Promise<SettlementInviteCode | null> => {
    try {
      const response = await fetch('/api/settlement/invite-code', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success && result.data.inviteCode) {
        const inviteCodeData = {
          code: result.data.inviteCode,
          formattedCode: result.data.inviteCode,
          createdAt: result.data.generatedAt || new Date().toISOString(),
          settlementId: result.data.settlement.id,
          settlementName: result.data.settlement.name
        };
        
        setInviteCode(inviteCodeData);
        return inviteCodeData;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch invite code from database:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    let mounted = true;
  
    const initializeFetch = async () => {
      try {
        // Fetch invite code from database (authoritative source)
        await fetchInviteCodeFromDatabase();
      } catch (error) {
        console.error('Failed to fetch invite code on settlement load:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeFetch();

    return () => {
      mounted = false;
    };
  }, [fetchInviteCodeFromDatabase]);

  // Function to regenerate invite code via API
  const regenerateInviteCode = async () => { 

    try {
      const response = await fetch('/api/settlement/invite-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
     
      const result = await response.json();
      
      if (result.success && result.data.inviteCode) {
        // Update state with database-generated code
        const newCode = {
          code: result.data.inviteCode,
          formattedCode: result.data.inviteCode,
          createdAt: result.data.regeneratedAt || new Date().toISOString(),
          settlementId: result.data.settlement.id,
          settlementName: result.data.settlement.name
        };
        
        setInviteCode(newCode);
        return newCode;
      } else {
        return null
      }
    } catch (error) {
      console.error('Failed to regenerate invite code:', error);
      return null;
    }
  };

  const clearSettlement = () => {
    setInviteCode(null);
  };

  // Function to generate invite code for any settlement ID (without full selection)
  const generateInviteCodeForSettlement = useCallback(async (settlementId: string, settlementName: string = 'Settlement'): Promise<SettlementInviteCode | null> => {
    const existingCode = await fetchInviteCodeFromDatabase();
    if (existingCode) {
      return existingCode;
    }
    
    // If no code exists, this should trigger settlement establishment flow
    console.warn('No invite code found in database for settlement:', settlementId);
    return null;
  }, [fetchInviteCodeFromDatabase]);

  return {
    inviteCode,
    isLoading,
    regenerateInviteCode,
    clearSettlement,
    generateInviteCodeForSettlement,
    fetchInviteCodeFromDatabase
  };
} 