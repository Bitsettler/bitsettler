import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client'

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - only allow from localhost in development
    const origin = request.headers.get('origin') || ''
    if (!origin.includes('localhost') && !origin.includes('bitsettler.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    console.log('🔄 Starting avatar migration...')

    // Use raw SQL to add the column
    const migrationSQL = `
      -- Add avatar_url column to settlement_members table
      ALTER TABLE settlement_members 
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;

      -- Add index for performance  
      CREATE INDEX IF NOT EXISTS idx_settlement_members_avatar_url 
      ON settlement_members(avatar_url) 
      WHERE avatar_url IS NOT NULL;
    `

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('❌ Migration failed:', error)
      return NextResponse.json({ 
        error: 'Migration failed',
        details: error.message 
      }, { status: 500 })
    }

    // Test that the column works
    const { error: testError } = await supabase
      .from('settlement_members')
      .select('id, avatar_url')
      .limit(1)

    if (testError) {
      console.error('❌ Column verification failed:', testError)
      return NextResponse.json({ 
        error: 'Column verification failed',
        details: testError.message 
      }, { status: 500 })
    }

    console.log('✅ Avatar migration completed successfully!')

    return NextResponse.json({ 
      success: true,
      message: 'Avatar migration applied successfully - avatar_url column is ready!'
    })

  } catch (error) {
    console.error('💥 Migration failed:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
