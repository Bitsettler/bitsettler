# Settlement Member Loading - Debugging Guide

## 🚨 Issue Summary

Settlement dashboard shows "Error Loading Members" and displays 0 members, even after onboarding sync claims success.

## 🔧 Root Causes Fixed

### 1. Missing Environment Variables ✅ FIXED
- **Problem**: No `.env.local` file meant Supabase client was `null`
- **Solution**: Created `.env.template` with required configuration

### 2. Database Schema Mismatch ✅ FIXED  
- **Problem**: `getAllMembers()` queried old `settlement_members` table directly
- **Solution**: Updated to use `settlement_member_details` view with correct column mapping

### 3. Missing Settlement Filtering ✅ FIXED
- **Problem**: Dashboard API didn't pass `settlementId` to member queries  
- **Solution**: Updated dashboard to filter members by settlement

### 4. API Fallback Logic ✅ FIXED
- **Problem**: Dashboard fell back to direct DB queries instead of using proper functions
- **Solution**: Updated to use `getAllMembers()` with settlement filtering

## 🧪 Testing Instructions

### Step 1: Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.template .env.local
   ```

2. **Configure Supabase credentials in `.env.local`:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DEFAULT_SETTLEMENT_ID=your-settlement-id
   DEFAULT_SETTLEMENT_NAME="Your Settlement Name"
   ```

3. **Verify Supabase connection:**
   - Check console logs for "Supabase not available" warnings
   - Should see "✅ Supabase client configured" instead

### Step 2: Database Schema Setup

1. **Run database migrations:**
   ```sql
   -- Run these in your Supabase SQL editor in order:
   -- /database/migrations/001_settlement_core_schema.sql
   -- /database/migrations/004_settlement_members_cache.sql
   ```

2. **Verify tables exist:**
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('settlement_members', 'settlement_citizens', 'settlement_member_details');
   ```

3. **Verify view exists:**
   ```sql
   -- Check the view
   SELECT * FROM settlement_member_details LIMIT 1;
   ```

### Step 3: Test Sync Process

1. **Start the development server:**
   ```bash
   cd C:\dev\bitcraft.guide-web-next
   npm run dev
   ```

2. **Test onboarding sync:**
   ```bash
   # POST to sync endpoint
   curl -X POST http://localhost:3000/api/settlement/sync/onboarding \
     -H "Content-Type: application/json" \
     -d '{"settlementId":"your-settlement-id","settlementName":"Your Settlement"}'
   ```

3. **Check console logs for:**
   ```
   ✅ Member sync completed for your-settlement-id:
      Members: X synced
      Citizens: Y synced
   ```

### Step 4: Test Member Loading

1. **Test members API:**
   ```bash
   curl "http://localhost:3000/api/settlement/members?settlementId=your-settlement-id"
   ```
   
   **Expected response:**
   ```json
   {
     "success": true,
     "data": [...],
     "meta": {
       "dataSource": "supabase"  // Not "bitjita_api_fallback"
     }
   }
   ```

2. **Test dashboard API:**
   ```bash
   curl "http://localhost:3000/api/settlement/dashboard?settlementId=your-settlement-id"
   ```
   
   **Expected response:**
   ```json
   {
     "stats": {
       "totalMembers": 69,  // Not 0
       "activeMembers": 45  // Not 0
     },
     "meta": {
       "dataSource": "local_database"  // Not demo_mode
     }
   }
   ```

### Step 5: Verify Database Data

1. **Check member data was saved:**
   ```sql
   -- Count members by settlement
   SELECT settlement_id, COUNT(*) as member_count 
   FROM settlement_members 
   GROUP BY settlement_id;
   
   -- Check specific settlement
   SELECT COUNT(*) FROM settlement_members 
   WHERE settlement_id = 'your-settlement-id';
   ```

2. **Check citizen data was saved:**
   ```sql
   -- Count citizens by settlement  
   SELECT settlement_id, COUNT(*) as citizen_count
   FROM settlement_citizens
   GROUP BY settlement_id;
   ```

3. **Test the view:**
   ```sql
   -- Check combined view data
   SELECT settlement_id, COUNT(*) as combined_count
   FROM settlement_member_details
   GROUP BY settlement_id;
   ```

## 🐛 Common Issues & Solutions

### Issue: "Supabase not available" logs
**Solution:** Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "relation does not exist" errors  
**Solution:** Run database migrations to create tables and views

### Issue: Sync claims success but no data in tables
**Diagnosis:**
```sql
-- Check sync logs
SELECT * FROM settlement_member_sync_log 
ORDER BY started_at DESC LIMIT 5;
```
**Solution:** Check for error messages in sync log and console

### Issue: Members API returns fallback data
**Check:** Console logs for database error details
**Solution:** Verify settlement_member_details view exists and has data

### Issue: Dashboard shows 0 members
**Check:** Verify settlement ID is being passed to APIs
**Solution:** Ensure DEFAULT_SETTLEMENT_ID matches your actual settlement

## 🔍 Debug Console Commands

**Test Supabase connection:**
```javascript
// In browser console on localhost:3000
const response = await fetch('/api/settlement/members?settlementId=your-settlement-id');
const data = await response.json();
console.log('Members API:', data);
```

**Check settlement ID configuration:**
```javascript
// Should match your actual settlement
console.log('Settlement ID from URL params or default config');
```

## ✅ Success Indicators

When everything is working correctly, you should see:

1. **Console logs:**
   ```
   ✅ Found X members in settlement_member_details view for settlement Y
   ✅ Found dashboard data: X members, Y active  
   ```

2. **API responses with:**
   - `dataSource: "supabase"` or `"local_database"`
   - Member counts > 0
   - No fallback messages

3. **Database contains:**
   - Records in `settlement_members` table
   - Records in `settlement_citizens` table  
   - Successful entries in `settlement_member_sync_log`

## 🚀 Quick Test Script

```bash
#!/bin/bash
echo "🧪 Testing Settlement Member System..."

echo "1. Testing sync..."
curl -s -X POST http://localhost:3000/api/settlement/sync/onboarding \
  -H "Content-Type: application/json" \
  -d '{"settlementId":"your-settlement-id","settlementName":"Test Settlement"}' | jq .

echo "2. Testing members API..."  
curl -s "http://localhost:3000/api/settlement/members?settlementId=your-settlement-id" | jq .meta.dataSource

echo "3. Testing dashboard..."
curl -s "http://localhost:3000/api/settlement/dashboard?settlementId=your-settlement-id" | jq .stats.totalMembers

echo "✅ Test complete"
``` 