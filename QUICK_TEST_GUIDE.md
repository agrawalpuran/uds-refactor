# Quick Test Guide - Mock Provider

## Problem Solved ✅

Since `https://api.shipway.in` is not reachable, we've created a **Mock Provider** that simulates API responses for testing.

## What's Configured

1. ✅ **Mock Provider** created in database (Provider Code: `MOCK`)
2. ✅ **System Shipping Config** enabled
3. ✅ **Test API Endpoint** ready at `/api/test/shipway`
4. ✅ **Mock Provider** simulates all API operations

## Quick Test (3 Steps)

### Step 1: Ensure Server is Running

```bash
npm run dev
# Server should be on http://localhost:3001
```

### Step 2: Test with Mock Provider

Open your browser or use curl:

```bash
# Test Health Check
curl -X POST "http://localhost:3001/api/test/shipway?providerCode=MOCK" \
  -H "Content-Type: application/json" \
  -d '{"testType": "health"}'

# Test Serviceability
curl -X POST "http://localhost:3001/api/test/shipway?providerCode=MOCK" \
  -H "Content-Type: application/json" \
  -d '{"testType": "serviceability", "pincode": "400070"}'

# Test Shipment Creation
curl -X POST "http://localhost:3001/api/test/shipway?providerCode=MOCK" \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "create",
    "payload": {
      "prNumber": "PR-TEST-001",
      "vendorId": "100001",
      "companyId": "100001",
      "fromAddress": {
        "name": "Test Vendor",
        "address": "123 Vendor Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "phone": "9876543210"
      },
      "toAddress": {
        "name": "Test Employee",
        "address": "456 Employee Lane",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400070",
        "phone": "9876543211"
      },
      "items": [
        {"productName": "Formal Shirt", "quantity": 2}
      ],
      "shipmentValue": 5000,
      "paymentMode": "PREPAID"
    }
  }'
```

### Step 3: Verify Results

You should see:
- ✅ Health check: `healthy: true`
- ✅ Serviceability: `serviceable: true` (for most pincodes)
- ✅ Shipment creation: `success: true` with tracking number

## What Mock Provider Does

- ✅ **Simulates API responses** without real API calls
- ✅ **Generates mock tracking numbers** and URLs
- ✅ **Simulates status progression** (CREATED → IN_TRANSIT → DELIVERED)
- ✅ **Validates payload structure** exactly as real provider would
- ✅ **No network dependency** - works offline

## Test Payload Structure

The Mock Provider accepts and validates the same payload structure as Shipway:

```json
{
  "prNumber": "PR-123456",
  "vendorId": "100001",
  "companyId": "100001",
  "fromAddress": {
    "name": "Vendor Name",
    "address": "Vendor Address",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "phone": "9876543210"
  },
  "toAddress": {
    "name": "Employee Name",
    "address": "Employee Address",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400070",
    "phone": "9876543211"
  },
  "items": [
    {
      "productName": "Formal Shirt",
      "quantity": 2,
      "weight": 0.5
    }
  ],
  "shipmentValue": 5000,
  "paymentMode": "PREPAID"
}
```

## Expected Response

```json
{
  "success": true,
  "providerShipmentReference": "MOCK-1234567890-ABC123",
  "trackingNumber": "TRACK-1234567890",
  "trackingUrl": "https://track.mock.com/TRACK-1234567890",
  "estimatedDeliveryDate": "2024-01-15T00:00:00.000Z",
  "awbNumber": "AWB-1234567890"
}
```

## Benefits

1. ✅ **No API Credentials Needed** - Test immediately
2. ✅ **No Network Dependency** - Works offline
3. ✅ **Fast Testing** - No real API latency
4. ✅ **Safe** - No risk of creating real shipments
5. ✅ **Complete** - Tests all integration paths

## When Real API is Available

Once you have access to real Shipway API:

1. Contact Shipway: contact@shipway.in
2. Get API credentials
3. Update `apiBaseUrl` in ShipwayProvider configuration
4. Test with real credentials using `providerCode=SHIPWAY`

## Files Created

- ✅ `lib/providers/MockProvider.ts` - Mock provider implementation
- ✅ `scripts/test-mock-provider.js` - Test script
- ✅ `app/api/test/shipway/route.ts` - Test API endpoint (supports MOCK)
- ✅ `TESTING_WITHOUT_REAL_API.md` - Detailed guide

## Testing Shiprocket with Your Postcode

### Method 1: Using PowerShell Script (Recommended)

```powershell
# Test serviceability for your postcode
.\scripts\test-serviceability.ps1 -Pincode "YOUR_PINCODE"

# Example: Test pincode 400070
.\scripts\test-serviceability.ps1 -Pincode "400070"

# With custom pickup location and weight
.\scripts\test-serviceability.ps1 -Pincode "400070" -FromPincode "400001" -Weight 2.0 -CodAmount 0
```

### Method 2: Direct API Call (PowerShell)

```powershell
# Replace YOUR_PINCODE with your actual pincode
$body = @{
    testType = "serviceability"
    pincode = "YOUR_PINCODE"
    fromPincode = "400001"
    weight = 1.0
    codAmount = 0
    email = "agrawalpuran@gmail.com"
    password = "!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/test/shipway?providerCode=SHIPROCKET" `
    -Method POST -ContentType "application/json" -Body $body
```

### Method 3: Using curl

```bash
curl -X POST "http://127.0.0.1:3001/api/test/shipway?providerCode=SHIPROCKET" \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "serviceability",
    "pincode": "YOUR_PINCODE",
    "fromPincode": "400001",
    "weight": 1.0,
    "codAmount": 0,
    "email": "agrawalpuran@gmail.com",
    "password": "!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr"
  }'
```

### What You'll Get

- ✅ **Serviceability Status**: Whether your pincode is serviceable
- ✅ **Available Couriers**: List of courier companies that can deliver
- ✅ **Delivery Estimates**: Estimated delivery days for each courier
- ✅ **Rates**: Shipping rates for each courier option
- ✅ **Delivery Modes**: Air or Surface shipping options

### Example Response

```json
{
  "tests": {
    "serviceability": {
      "success": true,
      "pincode": "400070",
      "result": {
        "serviceable": true,
        "estimatedDays": 3,
        "message": "Serviceable by 50 courier(s)"
      }
    }
  }
}
```

## Next Steps

1. ✅ Mock Provider is ready - Test now!
2. ✅ Shiprocket Provider is ready - Test with your postcode!
3. Validate payload structure
4. Test integration flow
5. When ready, switch to real Shipway API

