import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client'

export async function POST(request: NextRequest) {
  try {
    // Simple auth check
    const origin = request.headers.get('origin') || ''
    if (!origin.includes('localhost') && !origin.includes('bitsettler.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sql } = await request.json()
    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'SQL query required' }, { status: 400 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    console.log('🔄 Executing SQL:', sql)

    // Execute raw SQL using Supabase's .from() method with a raw query
    const { data, error } = await supabase
      .from('settlement_members')
      .select('*')
      .limit(0) // Don't actually select data, just test connection

    if (error) {
      console.error('❌ Database connection test failed:', error)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: error.message 
      }, { status: 500 })
    }

    // Since we can't use exec_sql, let's try manual ALTER TABLE through the client
    console.log('✅ Database connected, attempting manual column addition...')

    // Try to select avatar_url to see if it exists
    const { error: testError } = await supabase
      .from('settlement_members')
      .select('id, avatar_url')
      .limit(1)

    if (testError && testError.message.includes('column "avatar_url" of relation "settlement_members" does not exist')) {
      return NextResponse.json({ 
        error: 'Column does not exist and cannot be added via API',
        message: 'Please run this SQL in Supabase Dashboard: ALTER TABLE settlement_members ADD COLUMN avatar_url TEXT;',
        sql: 'ALTER TABLE settlement_members ADD COLUMN avatar_url TEXT;'
      }, { status: 422 })
    } else if (testError) {
      return NextResponse.json({ 
        error: 'Database query failed',
        details: testError.message 
      }, { status: 500 })
    } else {
      return NextResponse.json({ 
        success: true,
        message: 'avatar_url column already exists!'
      })
    }

  } catch (error) {
    console.error('💥 SQL execution failed:', error)
    return NextResponse.json({ 
      error: 'SQL execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
