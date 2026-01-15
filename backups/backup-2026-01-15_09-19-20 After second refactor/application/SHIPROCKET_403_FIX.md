# Fixing Shiprocket 403 Unauthorized Error

## Problem
Getting `403: Unauthorized. You do not have permission for this action.` when creating shipments.

## Root Cause
Your Shiprocket account is authenticated but doesn't have permission to create shipments via API.

## Solutions (Try in Order)

### Solution 1: Verify Account Status in Shiprocket Dashboard

1. **Login to Shiprocket Dashboard**: https://app.shiprocket.in/
2. **Check Account Status**:
   - Go to **Settings** → **Account Settings**
   - Verify account is **Active** and **Verified**
   - Check if **KYC** is completed
   - Ensure account is not in **Test/Demo** mode

3. **Check API Permissions**:
   - Go to **Settings** → **API Settings** or **Developer Settings**
   - Verify **API Access** is enabled
   - Check if **Shipment Creation** permission is granted
   - Ensure your account has **Production Access** (not just test access)

### Solution 2: Verify API Endpoint

The code is using: `/v1/external/orders/create/adhoc`

**Check if your account supports this endpoint:**
- Some accounts might need to use `/v1/external/orders/create/forward-shipment` instead
- Or your account might need to create orders first, then convert to shipment

### Solution 3: Check Account Type

**Different Shiprocket account types have different permissions:**
- **Free/Trial Accounts**: May have limited API access
- **Paid Accounts**: Full API access
- **Enterprise Accounts**: Custom permissions

**Action**: Contact Shiprocket support to:
- Verify your account has API shipment creation enabled
- Request API permissions if missing
- Upgrade account if needed

### Solution 4: Verify Credentials

**Make sure you're using the correct account:**
- The email/password should be for an account with **API access**
- Some accounts might have separate API credentials
- Check if Shiprocket provides **API tokens** instead of email/password

### Solution 5: Check Shiprocket Documentation

**Verify the API endpoint and requirements:**
- Check Shiprocket API documentation: https://apidocs.shiprocket.in/
- Verify your account type supports the endpoint
- Check if there are any account-level restrictions

### Solution 6: Contact Shiprocket Support

**If none of the above work:**
1. Contact Shiprocket support: support@shiprocket.in
2. Provide them:
   - Your account email
   - The error message: "403 Unauthorized - You do not have permission for this action"
   - Request API shipment creation permissions
   - Ask them to verify your account status

## Quick Test: Verify API Access

Test if your account can access other Shiprocket endpoints:

```javascript
// Test 1: Get couriers (usually works even with limited access)
fetch('https://apiv2.shiprocket.in/v1/external/courier/serviceability/', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN', // Get token from Shiprocket
  }
})
  .then(r => r.json())
  .then(data => console.log('Couriers:', data));

// Test 2: Check account info
fetch('https://apiv2.shiprocket.in/v1/external/account/profile', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
  }
})
  .then(r => r.json())
  .then(data => console.log('Account:', data));
```

## Alternative: Use Shiprocket Webhook/Manual Flow

If API access is not available:
1. Create orders manually in Shiprocket dashboard
2. Use Shiprocket webhooks to sync status back to UDS
3. Or use a different shipping provider that has API access

## Most Likely Solution

**90% of 403 errors are due to:**
1. Account not verified/KYC incomplete
2. API permissions not enabled in Shiprocket dashboard
3. Account is in test/demo mode

**Action**: Login to Shiprocket dashboard and verify account status and API permissions.

