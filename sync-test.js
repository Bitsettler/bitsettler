// Quick script to test settlement sync
const baseUrl = 'http://localhost:3000';

console.log('🔍 Checking settlement sync status...');

// First check current status
fetch(`${baseUrl}/api/admin/sync-settlements`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Settlement-Sync-Test'
  }
})
.then(response => {
  console.log(`Status check response: ${response.status}`);
  return response.text();
})
.then(data => {
  console.log('Current status:', data);
  
  if (data.includes('"needsSync":true') || data.includes('"totalSettlements":0')) {
    console.log('\n🚀 Starting full settlement sync...');
    
    // Trigger the sync
    return fetch(`${baseUrl}/api/admin/sync-settlements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Settlement-Sync-Test'
      },
      body: JSON.stringify({ mode: 'full' })
    });
  } else {
    console.log('Database already has settlements, skipping sync');
    return null;
  }
})
.then(response => {
  if (response) {
    console.log(`Sync response: ${response.status}`);
    return response.text();
  }
  return null;
})
.then(data => {
  if (data) {
    console.log('Sync result:', data);
  }
})
.catch(error => {
  console.error('Error:', error);
});