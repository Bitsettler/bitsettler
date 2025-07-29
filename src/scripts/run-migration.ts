// Simple migration runner for adding NextAuth support
// Run this with: npx ts-node src/scripts/run-migration.ts

import { createServerClient } from '../lib/spacetime-db-new/shared/supabase-client';

async function runMigration() {
  const supabase = createServerClient();
  
  if (!supabase) {
    console.error('❌ Supabase not available');
    return;
  }

  try {
    console.log('🔄 Running NextAuth migration...');
    
    // Add auth_user_id column to settlement_members
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE settlement_members ADD COLUMN IF NOT EXISTS auth_user_id TEXT UNIQUE;'
    });

    if (alterError) {
      console.error('❌ Error adding auth_user_id column:', alterError);
      return;
    }

    // Add index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_settlement_members_auth_user_id ON settlement_members(auth_user_id);'
    });

    if (indexError) {
      console.error('❌ Error adding index:', indexError);
      return;
    }

    console.log('✅ NextAuth migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();