import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSupabaseSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const updates = await request.json();

    // Validate allowed fields (only app user fields, not game data)
    const allowedFields = [
      'display_name',
      'discord_handle', 
      'bio',
      'timezone',
      'preferred_contact',
      'theme',
      'profile_color',
      'default_settlement_view',
      'notifications_enabled',
      'activity_tracking_enabled'
    ];

    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add timestamp
    filteredUpdates.app_last_active_at = new Date().toISOString();

    // Update the member profile
    const { data: member, error } = await supabase
      .from('settlement_members')
      .update(filteredUpdates)
      .eq('supabase_user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: member
    });

  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 