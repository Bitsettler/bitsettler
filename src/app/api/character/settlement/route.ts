import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { requireAuth } from '@/lib/supabase-server-auth';
import { BitJitaAPI } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';
import { shouldRateLimit, characterClaimRateLimit } from '@/lib/rate-limiting';

interface SettlementData {
    entityId: string;
    name: string;
    tier: number;
    treasury: number;
    supplies: number;
    tiles: number;
    regionName: string;
    regionId: string;
    isOwner: boolean;
    isEstablished: boolean;
    permissions: {
        inventory: boolean;
        build: boolean;
        officer: boolean;
        coOwner: boolean;
    };
}

export async function POST(request: NextRequest) {
    const logger = createRequestLogger(request, '/api/character/claim');
      
    try {
      logger.info('Character claim request started');
      
      const authResult = await requireAuth(request);
      if (authResult.error) {
        logger.warn('Authentication failed', { error: authResult.error });
        return NextResponse.json(
          { success: false, error: authResult.error },
          { status: authResult.status }
        );
      }
  
      const { user } = authResult;
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 401 }
        );
      }

      const userLogger = logger.child({ userId: user.id });
      
      // if (shouldRateLimit(request)) {
      //   const rateLimitCheck = await characterClaimRateLimit(user.id)(request);
      //   if (!rateLimitCheck.allowed && rateLimitCheck.response) {
      //     userLogger.warn('Rate limit exceeded for character claiming');
      //     return rateLimitCheck.response;
      //   }
      // }
         
      const serviceClient = createServerClient();
      
      if (!serviceClient) {
        return NextResponse.json(
          { success: false, error: 'Database service unavailable' },
          { status: 500 }
        );
      }
      const body = await request.json();
      const { playerEntityId } = body;

      if (!playerEntityId) {
        return NextResponse.json(
          { success: false, error: 'Player entity ID is required' },
          { status: 400 }
        );
      }

    // Fetch character details from BitJita API to verify it exists and get current data
    const profileResult = await BitJitaAPI.fetchPlayerProfile(playerEntityId);
    
    if (!profileResult.success || !profileResult.data) {
      console.error('❌ Failed to fetch character profile from BitJita:', profileResult.error);
      return NextResponse.json(
        { success: false, error: 'Character not found or BitJita API error' },
        { status: 404 }
      );
    }

    const settlements = profileResult.data.settlements;
    const establishedSettlements: Array<SettlementData> = [];
    const joinableSettlements: Array<SettlementData> = [];

    for (const item of settlements) {
      const { data: settlementData, error: settlementError } = await serviceClient
        .from('settlements_master')
        .select('*')
        .eq('id', item.entityId)
        .single();
      
      const isEstablished = settlementData?.is_established || false;
      
      const settlementWithEstablishedStatus = {
        ...item,
        isEstablished: isEstablished,
      };

      // Categorize based on new logic
      if (item.isOwner && !isEstablished) {
        // Owner of non-established settlement → Established board
        establishedSettlements.push(settlementWithEstablishedStatus);
      } else {
        // All others → Joinable board
        joinableSettlements.push(settlementWithEstablishedStatus);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        established: establishedSettlements,
        joinable: joinableSettlements
      }
    });

    } catch (error) {
      console.error('❌ Unexpected error in character claim:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
}