/**
 * Script to apply avatar_url column migration
 * Run this once to add the avatar_url column to settlement_members table
 */

import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client'

async function applyAvatarMigration() {
  console.log('🔄 Starting avatar migration...')
  
  const supabase = createServerClient()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  try {
    // Add avatar_url column to settlement_members table
    console.log('📝 Adding avatar_url column...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE settlement_members 
        ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      `
    })

    if (alterError) {
      console.error('❌ Error adding column:', alterError)
      throw alterError
    }

    console.log('✅ avatar_url column added successfully')

    // Add index for performance
    console.log('📝 Adding index for avatar_url...')
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_settlement_members_avatar_url 
        ON settlement_members(avatar_url) 
        WHERE avatar_url IS NOT NULL;
      `
    })

    if (indexError) {
      console.error('❌ Error adding index:', indexError)
      throw indexError
    }

    console.log('✅ Index added successfully')

    // Verify the column exists
    console.log('🔍 Verifying column exists...')
    const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'settlement_members' 
        AND column_name = 'avatar_url';
      `
    })

    if (checkError) {
      console.error('❌ Error checking column:', checkError)
      throw checkError
    }

    if (columns && columns.length > 0) {
      console.log('✅ Migration successful! avatar_url column is ready')
      console.log('Column details:', columns)
    } else {
      console.log('⚠️ Column verification failed - may need manual check')
    }

  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  applyAvatarMigration()
    .then(() => {
      console.log('🎉 Avatar migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💀 Migration failed:', error)
      process.exit(1)
    })
}

export { applyAvatarMigration }
