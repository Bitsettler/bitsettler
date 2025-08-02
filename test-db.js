// Test direct database access
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Database Test');
console.log('URL:', supabaseUrl);
console.log('Service Key present:', !!serviceKey);

const supabase = createClient(supabaseUrl, serviceKey);

async function testDatabase() {
  try {
    console.log('\n📊 Testing settlement_projects table...');
    
    // Test 1: Count all projects
    const { count, error: countError } = await supabase
      .from('settlement_projects')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count error:', countError);
    } else {
      console.log('✅ Project count:', count);
    }
    
    // Test 2: Fetch all projects
    const { data: projects, error: fetchError } = await supabase
      .from('settlement_projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
    } else {
      console.log(`✅ Projects fetched: ${projects.length}`);
      projects.forEach((p, i) => {
        console.log(`  ${i+1}. "${p.name}" - ${p.status} (created: ${p.created_at})`);
      });
    }
    
    // Test 3: Try to create a test project
    console.log('\n🧪 Testing project creation...');
    const { data: newProject, error: createError } = await supabase
      .from('settlement_projects')
      .insert({
        name: 'Direct DB Test Project',
        description: 'Testing direct database access',
        status: 'Active',
        priority: 3,
        created_by: 'DATABASE_TEST'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Create error:', createError);
    } else {
      console.log('✅ Test project created:', newProject.id);
      
      // Clean up test project
      await supabase
        .from('settlement_projects')
        .delete()
        .eq('id', newProject.id);
      console.log('🗑️ Test project cleaned up');
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

testDatabase();