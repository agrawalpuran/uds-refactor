# Shipway Integration Setup Guide

## Overview

This guide explains how to configure and test Shipway logistics provider integration in UDS.

**⚠️ IMPORTANT NOTE**: The Shipway API endpoint (`https://api.shipway.in`) may not be publicly accessible or may require specific authentication. For testing purposes, we recommend using the **Mock Provider** first to validate payload structure and integration flow.

## Testing Without Real API

### Option 1: Use Mock Provider (Recommended for Testing)

The Mock Provider simulates API responses without requiring a real API endpoint:

1. Create Mock Provider via Super Admin UI (or use test script)
2. Test payload structure and integration flow
3. Validate all UDS → Provider field mappings
4. Test status synchronization logic

**Benefits**:
- No API credentials needed
- No network dependency
- Fast testing cycle
- Perfect for development

### Option 2: Use Test API Endpoint

```bash
# Test with Mock Provider
curl -X POST "http://localhost:3001/api/test/shipway?providerCode=MOCK" \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "create",
    "payload": { ... }
  }'
```

## Prerequisites

1. Shipway account with API credentials
2. Super Admin access to UDS
3. MongoDB connection configured

## Step 1: Configure Shipway Provider (Super Admin)

1. Log in as Super Admin
2. Navigate to **Logistics & Shipping** → **Service Providers**
3. Click **Add Provider**
4. Fill in the form:
   - **Provider Code**: `SHIPWAY`
   - **Provider Name**: `Shipway Logistics`
   - **Provider Type**: `API Aggregator`
   - **API Base URL**: `https://api.shipway.in` (or your Shipway API endpoint)
   - **API Version**: `v1` (or your Shipway API version)
   - **Auth Type**: `API Key`
   - **Capabilities**: Enable all supported capabilities
     - ✅ Create Shipment
     - ✅ Tracking
     - ✅ Serviceability Check
     - ✅ Cancellation
     - ⬜ Webhooks (if supported)
5. Click **Create**
6. Ensure provider is **Active**

## Step 2: Enable Shipping Integration

1. Navigate to **Logistics & Shipping** → **Integration Settings**
2. Toggle **Enable Shipping Integration** to **ON**
3. Click **Save Configuration**

## Step 3: Configure Company Shipping Provider (Company Admin)

1. Log in as Company Admin
2. Navigate to **Settings** → **Shipping Providers** (if available)
3. Select Shipway from the list
4. Enter credentials:
   - **API Key**: Your Shipway API key
   - **API Secret**: Your Shipway API secret
5. Mark as **Enabled** and optionally set as **Default**
6. Save

**Note**: Company-level provider configuration UI is a future enhancement. For now, credentials can be added via database or API.

## Step 4: Test Integration

### Option A: Using Test Script

```bash
# Set environment variables (optional, for testing)
# Add to .env.local:
# SHIPWAY_API_KEY=your_api_key
# SHIPWAY_API_SECRET=your_api_secret
# SHIPWAY_API_BASE_URL=https://api.shipway.in

# Run test script
npm run test-shipway
# or
node scripts/test-shipway-integration.js
```

### Option B: Using Test API Endpoint

```bash
# Get configuration status
curl http://localhost:3001/api/test/shipway

# Test health check
curl -X POST http://localhost:3001/api/test/shipway \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_api_key",
    "apiSecret": "your_api_secret",
    "testType": "health"
  }'

# Test serviceability
curl -X POST http://localhost:3001/api/test/shipway \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_api_key",
    "apiSecret": "your_api_secret",
    "testType": "serviceability",
    "pincode": "400070"
  }'

# Test shipment creation
curl -X POST http://localhost:3001/api/test/shipway \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_api_key",
    "apiSecret": "your_api_secret",
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
        {
          "productName": "Formal Shirt",
          "quantity": 2
        }
      ],
      "shipmentValue": 5000,
      "paymentMode": "PREPAID"
    }
  }'
```

## Step 5: Test Payload Structure

### Create Shipment Payload

```json
{
  "prNumber": "PR-123456",
  "poNumber": "PO-789012",
  "vendorId": "100001",
  "companyId": "100001",
  "fromAddress": {
    "name": "Vendor Name",
    "address": "Vendor Address Line 1",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "phone": "9876543210",
    "email": "vendor@example.com"
  },
  "toAddress": {
    "name": "Employee Name",
    "address": "Employee Address Line 1",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400070",
    "phone": "9876543211",
    "email": "employee@example.com"
  },
  "items": [
    {
      "productName": "Formal Shirt",
      "quantity": 2,
      "weight": 0.5
    },
    {
      "productName": "Formal Trousers",
      "quantity": 1,
      "weight": 0.6
    }
  ],
  "shipmentValue": 5000,
  "paymentMode": "PREPAID",
  "codAmount": 0
}
```

### Expected Response

```json
{
  "success": true,
  "providerShipmentReference": "SHIPWAY123456",
  "trackingNumber": "TRACK123456",
  "trackingUrl": "https://track.shipway.in/TRACK123456",
  "estimatedDeliveryDate": "2024-01-15T00:00:00.000Z",
  "awbNumber": "AWB123456",
  "rawResponse": {
    // Raw Shipway API response
  }
}
```

## Shipway API Mapping

### UDS → Shipway Field Mapping

| UDS Field | Shipway Field | Notes |
|-----------|---------------|-------|
| `prNumber` | `order_id` | PR/Order identifier |
| `fromAddress.name` | `from_name` | Sender name |
| `fromAddress.address` | `from_address` | Sender address |
| `fromAddress.city` | `from_city` | Sender city |
| `fromAddress.state` | `from_state` | Sender state |
| `fromAddress.pincode` | `from_pincode` | Sender pincode |
| `fromAddress.phone` | `from_phone` | Sender phone |
| `toAddress.*` | `to_*` | Recipient fields (same pattern) |
| `items[].productName` | `items[].name` | Product name |
| `items[].quantity` | `items[].quantity` | Quantity |
| `items[].weight` | `items[].weight` | Weight (optional) |
| `paymentMode` | `payment_mode` | 'PREPAID' → 'prepaid', 'COD' → 'cod' |
| `codAmount` | `cod_amount` | COD amount (if applicable) |
| `shipmentValue` | `shipment_value` | Total shipment value |

### Shipway → UDS Status Mapping

| Shipway Status | UDS Status | Notes |
|----------------|-----------|-------|
| `CREATED`, `PICKED`, `BOOKED` | `CREATED` | Shipment created |
| `IN_TRANSIT`, `TRANSIT`, `SHIPPED` | `IN_TRANSIT` | In transit |
| `DELIVERED`, `COMPLETED` | `DELIVERED` | Delivered |
| `FAILED`, `CANCELLED`, `REJECTED` | `FAILED` | Failed/Cancelled |

## Troubleshooting

### Issue: Provider not found
**Solution**: Ensure Shipway provider is created via Super Admin UI and marked as Active.

### Issue: API authentication fails
**Solution**: 
- Verify API key and secret are correct
- Check if credentials are encrypted in CompanyShippingProvider
- Ensure API base URL is correct

### Issue: Serviceability check fails
**Solution**:
- Verify pincode format (6 digits for India)
- Check if Shipway supports serviceability API
- Review API documentation for required parameters

### Issue: Shipment creation fails
**Solution**:
- Verify all required fields are present
- Check address format matches Shipway requirements
- Ensure items array is not empty
- Review error message in `rawResponse`

## Environment Variables

Add to `.env.local` for testing:

```env
# Shipway API Credentials (for testing)
SHIPWAY_API_KEY=your_shipway_api_key
SHIPWAY_API_SECRET=your_shipway_api_secret
SHIPWAY_API_BASE_URL=https://api.shipway.in
```

**Note**: In production, credentials should be stored encrypted in `CompanyShippingProvider` table, not in environment variables.

## Next Steps

1. **Test with Real Credentials**: Once Shipway account is set up, test with real API credentials
2. **Configure Company Provider**: Set up CompanyShippingProvider with encrypted credentials
3. **Test End-to-End**: Create a test order and mark as shipped via API
4. **Monitor Sync**: Run `npm run sync-shipments` to test status synchronization
5. **Review Logs**: Check `ShipmentApiLog` collection for API call audit trail

## Support

For Shipway API documentation, visit: https://docs.shipway.in

For UDS shipping integration issues, check:
- `SHIPMENT_API_LOG` collection for API call logs
- Server logs for error messages
- `Shipment` collection for shipment records

