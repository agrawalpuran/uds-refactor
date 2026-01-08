# Vendor Product Debugging Guide

## Quick Debug Steps

### 1. Test Debug API Endpoint
Open in browser or use curl:
```
http://localhost:3001/api/debug/vendor-products?vendorId=100003
```

This will show:
- Vendor information
- ProductVendor relationship queries (ObjectId, string, manual filter)
- Products found
- Detailed diagnostic information

### 2. Check Server Console Logs
The server console (where `npm run dev` is running) will show detailed logs with:
- `[getProductsByVendor]` - Backend processing
- `[VENDOR_RESOLUTION]` - Vendor resolution
- `[API]` - API boundary logs

### 3. Check Browser Console
The browser console will show:
- `[VendorCatalogPage]` - Frontend vendorId resolution
- `[FRONTEND]` - Frontend API calls
- Product count and warnings

### 4. Key Log Markers to Look For

**If ProductVendor links are found:**
```
[getProductsByVendor] ✅ Found matching ProductVendor link
[getProductsByVendor] Product IDs extracted: [...]
[getProductsByVendor] ✅ Successfully found X products
```

**If ProductVendor links are NOT found:**
```
[getProductsByVendor] ❌ No matching ProductVendor links found
[getProductsByVendor] Sample ProductVendor link vendorId formats
```

**If products are filtered out:**
```
[getProductsByVendor] ❌ SECURITY: Product X is NOT in ProductVendor relationships - REMOVING
```

## Common Issues

### Issue 1: No ProductVendor Links Found
**Symptom:** `Total ProductVendor relationships found: 0`

**Possible Causes:**
- ProductVendor relationships don't exist in database
- vendorId format mismatch (ObjectId vs string)
- Wrong vendor ID being used

**Solution:** Check the debug API output to see:
- What vendorId format is stored in ProductVendor links
- What vendorId format we're querying with
- Whether manual filter finds matches

### Issue 2: ProductVendor Links Found But Products Not Returned
**Symptom:** `Product IDs extracted: [...]` but `Successfully found 0 products`

**Possible Causes:**
- ProductIds don't match product _id in database
- Products were deleted but relationships remain (orphaned)
- Products filtered out by validation step

**Solution:** Check logs for:
- Product query results
- Validation step results
- Any "SECURITY: Product X is NOT in ProductVendor relationships" messages

### Issue 3: Products Found But Filtered Out
**Symptom:** `Successfully found X products` but `Returning 0 products`

**Possible Causes:**
- Validation step is incorrectly filtering products
- productId format mismatch in validation Set

**Solution:** Check validation logs to see which products are being removed and why

## Testing Specific Vendors

### Test Elite Uniforms (100003)
```
http://localhost:3001/api/debug/vendor-products?vendorId=100003
```

### Test Footwear Plus (100002)
```
http://localhost:3001/api/debug/vendor-products?vendorId=100002
```

### Test UniformPro Inc (100001)
```
http://localhost:3001/api/debug/vendor-products?vendorId=100001
```

## Next Steps

1. Access the debug API endpoint for the problematic vendor
2. Check server console for detailed `[getProductsByVendor]` logs
3. Share the debug API response and server console output
4. We'll identify the exact failure point and fix it

