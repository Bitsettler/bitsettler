import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlementId, amount, transactionType, category, description } = body;

    if (!settlementId || !amount || !transactionType) {
      return NextResponse.json(
        { success: false, error: 'Settlement ID, amount, and transaction type are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Insert the transaction
    const { data, error } = await supabase
      .from('treasury_transactions')
      .insert({
        settlement_id: settlementId,
        amount: parseFloat(amount),
        transaction_type: transactionType,
        category: category || null,
        description: description || null,
        transaction_date: new Date().toISOString(),
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
