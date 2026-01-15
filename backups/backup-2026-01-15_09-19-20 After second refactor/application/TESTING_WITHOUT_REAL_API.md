# Testing Shipping Integration Without Real API

## Problem

The Shipway API endpoint (`https://api.shipway.in`) may not be publicly accessible or may require specific authentication setup. This makes it difficult to test the integration during development.

## Solution: Mock Provider

We've created a **Mock Provider** that simulates API responses without requiring a real API endpoint. This allows you to:

- ✅ Test payload structure
- ✅ Validate field mappings
- ✅ Test integration flow
- ✅ Test status synchronization
- ✅ Develop without API credentials

## Quick Start

### 1. Mock Provider is Already Configured

The Mock Provider has been automatically created in your database:
- **Provider Code**: `MOCK`
- **Provider Name**: `Mock Logistics Provider (Testing)`
- **Provider ID**: `PROV_MOCK_MJWTQQ86` (or similar)

### 2. Test via API Endpoint

```bash
# Test with Mock Provider (no credentials needed)
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

### 3. Test Health Check

```bash
curl -X POST "http://localhost:3001/api/test/shipway?providerCode=MOCK" \
  -H "Content-Type: application/json" \
  -d '{"testType": "health"}'
```

### 4. Test Serviceability

```bash
curl -X POST "http://localhost:3001/api/test/shipway?providerCode=MOCK" \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "serviceability",
    "pincode": "400070"
  }'
```

### 5. Test All Operations

```bash
curl -X POST "http://localhost:3001/api/test/shipway?providerCode=MOCK" \
  -H "Content-Type: application/json" \
  -d '{"testType": "all"}'
```

## Mock Provider Behavior

### Shipment Creation
- ✅ Always succeeds (unless error simulation is enabled)
- ✅ Generates mock tracking number
- ✅ Generates mock tracking URL
- ✅ Sets estimated delivery date (3-5 days from creation)
- ✅ Returns provider shipment reference

### Status Tracking
- ✅ Simulates status progression:
  - Day 0: `CREATED`
  - Day 1+: `IN_TRANSIT`
  - Day 5+: `DELIVERED`
- ✅ Returns tracking information
- ✅ Updates delivery date when status = DELIVERED

### Serviceability Check
- ✅ Most pincodes are serviceable
- ✅ Returns estimated delivery days (3-5 days)
- ✅ Some pincodes (999999, 000000) marked as non-serviceable

### Health Check
- ✅ Always returns healthy (unless error simulation enabled)
- ✅ Returns response time (20-70ms)

## Using Mock Provider in Development

### Option 1: Via Super Admin UI

1. Log in as Super Admin
2. Navigate to **Logistics & Shipping** → **Service Providers**
3. Find "Mock Logistics Provider (Testing)"
4. Ensure it's **Active**

### Option 2: Via Test Script

```bash
npm run test-mock-provider
```

### Option 3: Via API

Use the test API endpoint with `providerCode=MOCK` parameter.

## When to Use Mock vs Real Provider

### Use Mock Provider When:
- ✅ Developing and testing integration
- ✅ Validating payload structure
- ✅ Testing status synchronization logic
- ✅ No API credentials available
- ✅ API endpoint is not accessible

### Use Real Provider When:
- ✅ Production deployment
- ✅ Final integration testing
- ✅ Validating with actual logistics partner
- ✅ Real API credentials available

## Testing Real Shipway API (When Available)

Once you have access to the real Shipway API:

1. **Get API Credentials**: Contact Shipway support (contact@shipway.in)
2. **Verify API Endpoint**: Confirm the correct API base URL
3. **Update Configuration**: 
   - Update `apiBaseUrl` in ShipwayProvider via Super Admin UI
   - Or update in database directly
4. **Test with Real Credentials**:
   ```bash
   curl -X POST "http://localhost:3001/api/test/shipway?providerCode=SHIPWAY" \
     -H "Content-Type: application/json" \
     -d '{
       "apiKey": "your_real_api_key",
       "apiSecret": "your_real_api_secret",
       "testType": "create",
       "payload": { ... }
     }'
   ```

## Mock Provider Configuration

The Mock Provider can be configured with:

```javascript
{
  simulateDelay: true,      // Simulate network delay (100-200ms)
  simulateErrors: false,     // Enable random errors
  errorRate: 0.1            // 10% error rate (if simulateErrors = true)
}
```

## Benefits of Mock Provider

1. **No Dependencies**: Works without network or API access
2. **Fast Testing**: No real API latency
3. **Predictable**: Consistent responses for testing
4. **Safe**: No risk of creating real shipments during development
5. **Complete**: Tests all integration paths

## Next Steps

1. ✅ Mock Provider is configured and ready
2. Test payload structure using Mock Provider
3. Validate integration flow
4. When ready, switch to real Shipway API (if available)
5. Update ShipwayProvider adapter based on actual API documentation

## Support

- **Mock Provider Issues**: Check `lib/providers/MockProvider.ts`
- **Test API Issues**: Check `app/api/test/shipway/route.ts`
- **Real Shipway API**: Contact Shipway support at contact@shipway.in

