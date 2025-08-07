import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';

export async function GET(request: NextRequest) {
  // This endpoint should not be called directly for fetching transactions.
  // Transactions should be fetched via /api/settlement/treasury?action=transactions
  return NextResponse.json(
    { 
      success: false, 
      error: 'Use /api/settlement/treasury?action=transactions to fetch transactions',
      redirect: '/api/settlement/treasury?action=transactions'
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlementId, amount, transactionType, category, description } = body;

    if (!amount || !transactionType || !description || !description.trim()) {
      return NextResponse.json(
        { success: false, error: 'Amount, transaction type, and description are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get the current user's settlement member ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's settlement member record
    const { data: member, error: memberError } = await supabase
      .from('settlement_members')
      .select('id, settlement_id')
      .eq('supabase_user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'Settlement member record not found. Please claim your character first.' },
        { status: 403 }
      );
    }

    // Validate settlement ID matches if provided
    if (settlementId && member.settlement_id !== settlementId) {
      return NextResponse.json(
        { success: false, error: 'Settlement ID does not match user\'s settlement' },
        { status: 403 }
      );
    }

    // Insert the transaction
    const { data, error } = await supabase
      .from('treasury_transactions')
      .insert({
        related_member_id: member.id,
        amount: parseFloat(amount),
        transaction_type: transactionType,
        category: category || null,
        description: description.trim(),
        transaction_date: new Date().toISOString().split('T')[0], // DATE format
        recorded_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to insert treasury transaction:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to add transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Transaction added successfully'
    });

  } catch (error) {
    console.error('Treasury transaction API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
