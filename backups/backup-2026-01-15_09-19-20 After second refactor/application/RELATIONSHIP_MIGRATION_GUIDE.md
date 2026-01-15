# Relationship Migration Guide

## Problem
ProductCompany and ProductVendor relationships stored with MongoDB ObjectIds instead of string IDs are not showing up in the Super Admin Relationships tab.

## Solution
I've fixed the code and created a migration script to convert all existing relationships from ObjectId format to string ID format.

## Changes Made

### 1. Fixed `getProductCompanies()` Function
- Now properly handles both ObjectId and string ID formats
- Correctly maps relationships to display in the UI

### 2. Fixed `getProductVendors()` Function  
- Now properly handles both ObjectId and string ID formats
- Correctly maps relationships to display in the UI

### 3. Created Migration API Endpoint
- **GET** `/api/admin/migrate-relationships` - Check current state
- **POST** `/api/admin/migrate-relationships` - Run migration

## How to Run Migration

### Option 1: Using API Endpoint (Recommended)

**Step 1: Check current state**
```bash
# Using curl (Linux/Mac)
curl -X GET http://localhost:3000/api/admin/migrate-relationships

# Using PowerShell (Windows)
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/migrate-relationships" -Method GET | Select-Object -ExpandProperty Content
```

**Step 2: Run migration**
```bash
# Using curl (Linux/Mac)
curl -X POST http://localhost:3000/api/admin/migrate-relationships

# Using PowerShell (Windows)
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/migrate-relationships" -Method POST | Select-Object -ExpandProperty Content
```

### Option 2: Using Browser Console

1. Open your browser's Developer Console (F12)
2. Navigate to the Super Admin page
3. Run this JavaScript:

```javascript
// Check current state
fetch('/api/admin/migrate-relationships')
  .then(r => r.json())
  .then(data => console.log('Current State:', data))

// Run migration
fetch('/api/admin/migrate-relationships', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log('Migration Results:', data))
```

### Option 3: Using Postman or Similar Tool

1. **GET** `http://localhost:3000/api/admin/migrate-relationships` - Check status
2. **POST** `http://localhost:3000/api/admin/migrate-relationships` - Run migration

## What the Migration Does

1. **Scans all ProductCompany relationships:**
   - Finds relationships with ObjectId-based `productId` or `companyId`
   - Looks up the corresponding string IDs from the Uniform and Company collections
   - Updates the relationship to use string IDs
   - Skips relationships that are already in the correct format
   - Removes duplicate relationships

2. **Scans all ProductVendor relationships:**
   - Finds relationships with ObjectId-based `productId` or `vendorId`
   - Looks up the corresponding string IDs from the Uniform and Vendor collections
   - Updates the relationship to use string IDs
   - Skips relationships that are already in the correct format
   - Removes duplicate relationships

3. **Reports results:**
   - Total relationships found
   - Number migrated
   - Number skipped (already correct)
   - Any errors encountered

## Expected Results

After migration, you should see:
- ✅ All ProductCompany relationships showing in the Super Admin Relationships tab
- ✅ All ProductVendor relationships showing in the Super Admin Relationships tab
- ✅ Orders can be created successfully (products linked to companies and vendors)

## Verification

After running the migration:

1. **Check the API response** - It will show how many relationships were migrated
2. **Refresh the Super Admin page** - Relationships should now appear in the Relationships tab
3. **Try creating an order** - Should work if products are properly linked

## Troubleshooting

### If relationships still don't show:

1. **Check if relationships exist in database:**
   - Use MongoDB Compass or similar tool
   - Check `productcompanies` collection
   - Check `productvendors` collection
   - Verify they have string IDs (6-digit numeric strings)

2. **Check browser console:**
   - Look for errors when loading the Super Admin page
   - Check network tab for API calls to `getProductCompanies` and `getProductVendors`

3. **Verify products/companies/vendors have string IDs:**
   - Products should have `id` field (e.g., "200001")
   - Companies should have `id` field (e.g., "100001")
   - Vendors should have `id` field (e.g., "300001")

### If migration fails:

- Check server logs for detailed error messages
- Ensure database connection is working
- Verify all products, companies, and vendors have valid string IDs

## Files Modified

1. `lib/db/data-access.ts`
   - Fixed `getProductCompanies()` function
   - Fixed `getProductVendors()` function

2. `app/api/admin/migrate-relationships/route.ts` (NEW)
   - GET endpoint to check current state
   - POST endpoint to run migration

3. `scripts/migrate-relationships.ts` (NEW)
   - Standalone migration script (optional)

## Next Steps

1. Run the migration using one of the methods above
2. Verify relationships appear in Super Admin Relationships tab
3. Test order creation to ensure everything works
