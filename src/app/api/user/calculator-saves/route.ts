import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client';

export async function GET(request: Request) {
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

    // Get user's settlement member ID first
    const { data: member } = await supabase
      .from('settlement_members')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'No character claimed' },
        { status: 404 }
      );
    }

    // Get calculator saves for this member
    const { data: saves, error } = await supabase
      .from('user_calculator_saves')
      .select('*')
      .eq('member_id', member.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch calculator saves:', error);
      return NextResponse.json(
        { error: 'Failed to fetch saves' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: saves || []
    });

  } catch (error) {
    console.error('Calculator saves API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Get user's settlement member ID first
    const { data: member } = await supabase
      .from('settlement_members')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'No character claimed' },
        { status: 404 }
      );
    }

    const { name, item_slug, quantity, recipe_data } = await request.json();

    if (!name || !item_slug || !recipe_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert calculator save (update if exists, insert if new)
    const { data: save, error } = await supabase
      .from('user_calculator_saves')
      .upsert({
        member_id: member.id,
        name,
        item_slug,
        quantity: quantity || 1,
        recipe_data
      }, {
        onConflict: 'member_id,item_slug'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save calculator data:', error);
      return NextResponse.json(
        { error: 'Failed to save calculation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: save
    });

  } catch (error) {
    console.error('Calculator save API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 