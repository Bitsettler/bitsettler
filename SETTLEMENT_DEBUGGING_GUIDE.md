# Settlement Member Loading - Debugging Guide

## 🚨 Issue Summary

Settlement dashboard shows "Error Loading Members" and displays 0 members, even after onboarding sync claims success.

## ✅ **RESOLVED ISSUES**

### 1. **Missing Environment Variables** ✅ FIXED
- **Problem**: No `.env.local` file meant Supabase client was `null`
- **Solution**: Created `.env.template` with required configuration

### 2. **Database Schema Mismatch** ✅ FIXED  
- **Problem**: `getAllMembers()` queried old `settlement_members` table directly
- **Solution**: Updated to use `settlement_member_details` view with correct column mapping

### 3. **Missing Settlement Filtering** ✅ FIXED
- **Problem**: Dashboard didn't pass `settlementId` to member queries  
- **Solution**: Updated dashboard to filter members by settlement

### 4. **Pagination Limiting Members** ✅ FIXED
- **Problem**: Only showing 20 members due to pagination limit
- **Solution**: Increased to 200 members per page, show all 149 members

### 5. **Inactive Member Filtering** ✅ FIXED
- **Problem**: Only showing 69 "active" members instead of all 149
- **Solution**: Changed to `includeInactive: true` by default

## 🚨 **REMAINING ISSUES**

### 1. **Missing Permissions Data** ❌ NOT FIXED
- **Problem**: All permissions showing as 0 (inventory, build, officer, coOwner)
- **Expected**: BitJita API should return permission levels for each member
- **Status**: Database schema supports it, but data isn't being captured
- **Investigation Needed**: Check if BitJita API returns permission data

### 2. **Missing Skills Data** ❌ NOT FIXED  
- **Problem**: Skills object is empty `{}`, no profession data
- **Expected**: Rich skills data with levels and XP per profession
- **Status**: Database schema supports it, but data isn't being captured
- **Investigation Needed**: Verify skills sync from citizens API

### 3. **Missing Calculated Fields** ❌ PARTIALLY FIXED
- **Problem**: Some calculated fields like top profession not working
- **Expected**: Automatic calculation of top profession from skills
- **Status**: View logic exists but depends on skills data

## 📋 **SUCCESS METRICS**

### ✅ **What's Working:**
- **Total Members**: 149 ✅ (all members loading)
- **Member Count**: Dashboard shows correct totals ✅
- **Basic Info**: Names, IDs, join dates ✅  
- **Individual Pages**: Member detail pages work ✅
- **Database Structure**: All tables and views created ✅
- **Sync Process**: 149 members + 149 citizens synced ✅

### ❌ **What's Still Broken:**
- **Permissions**: All showing as 0 instead of actual values
- **Skills**: Empty skills objects instead of rich data
- **Professions**: Showing "Unknown" instead of calculated top profession
- **Rich Member Data**: Missing XP, skill levels, detailed info

## 🔧 **Next Actions Required**

### 1. **Investigate BitJita API Response**
```bash
# Check what the actual BitJita API returns
curl "https://api.bitjita.com/settlement/[ID]/roster"
curl "https://api.bitjita.com/settlement/[ID]/citizens"
```

### 2. **Debug Sync Process**
- Add logging to see actual data being returned from BitJita
- Verify permissions are in the API response
- Check if skills data is properly formatted

### 3. **Verify Database Storage**
```sql
-- Check if permissions are being saved
SELECT entity_id, user_name, 
       inventory_permission, build_permission, 
       officer_permission, co_owner_permission 
FROM settlement_members 
WHERE settlement_id = 'your-settlement-id' 
LIMIT 10;

-- Check if skills are being saved  
SELECT entity_id, user_name, skills, top_profession
FROM settlement_citizens 
WHERE settlement_id = 'your-settlement-id' 
LIMIT 10;
```

### 4. **Test Member Data Quality**
- Individual member pages should show:
  - ✅ Basic info (name, ID, join date)
  - ❌ Permission levels (inventory, build, officer, co-owner)
  - ❌ Skills breakdown with levels and XP
  - ❌ Calculated top profession
  - ❌ Rich activity data

## 🎯 **Core Issue Summary**

The **member loading infrastructure** is now fully working (149 members load consistently), but the **data quality** is poor because permissions and skills aren't being captured from the BitJita API properly.

**Priority**: Fix data capture to show rich member information that was in the original API design. 