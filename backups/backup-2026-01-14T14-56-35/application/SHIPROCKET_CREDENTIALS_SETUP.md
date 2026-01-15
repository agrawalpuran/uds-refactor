# Shiprocket Credentials Setup Guide

## Problem
Shiprocket authentication is failing because email and password credentials are missing from `CompanyShippingProvider`.

## Solution: Update Credentials via API

### Step 1: Find the Provider ID

First, get the list of providers for company 100004:

**Option A: Browser Console**
```javascript
fetch('/api/companies/100004/shipping-providers')
  .then(r => r.json())
  .then(data => {
    console.log('Providers:', data);
    data.forEach(p => {
      console.log(`Provider ID: ${p.providerId}, Name: ${p.providerName}, Code: ${p.providerCode}`);
    });
  });
```

**Option B: Direct API Call**
```
GET http://localhost:3001/api/companies/100004/shipping-providers
```

### Step 2: Update Credentials

Once you have the `providerId` (e.g., `PROV_SR_ICICI`), update the credentials:

**Option A: Browser Console**
```javascript
// Replace these values with your actual Shiprocket credentials
const companyId = '100004';
const providerId = 'PROV_SR_ICICI'; // Get this from Step 1
const email = 'your-shiprocket-email@example.com';
const password = 'your-shiprocket-password';

fetch(`/api/companies/${companyId}/shipping-providers`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    providerId: providerId,
    credentials: {
      apiKey: email,      // For Shiprocket, apiKey = email
      apiSecret: password, // For Shiprocket, apiSecret = password
    },
    updatedBy: 'Admin',
  }),
})
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.error('❌ Error:', data.error);
    } else {
      console.log('✅ Success! Credentials updated:', data);
    }
  })
  .catch(err => console.error('❌ Request failed:', err));
```

**Option B: Using curl (PowerShell)**
```powershell
$body = @{
    providerId = "PROV_SR_ICICI"
    credentials = @{
        apiKey = "your-email@shiprocket.com"
        apiSecret = "your-password"
    }
    updatedBy = "Admin"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/companies/100004/shipping-providers" `
    -Method PUT `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body
```

**Option C: Using Postman or similar tool**
- Method: `PUT`
- URL: `http://localhost:3001/api/companies/100004/shipping-providers`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "providerId": "PROV_SR_ICICI",
  "credentials": {
    "apiKey": "your-email@shiprocket.com",
    "apiSecret": "your-password"
  },
  "updatedBy": "Admin"
}
```

### Step 3: Verify

After updating, verify the credentials are stored:

```javascript
fetch('/api/companies/100004/shipping-providers')
  .then(r => r.json())
  .then(data => {
    console.log('Updated providers:', data);
  });
```

### Step 4: Test Shipment Creation

Try creating a shipment again. The system should now:
1. ✅ Authenticate with Shiprocket successfully
2. ✅ Create shipment via API
3. ✅ Capture AWB number in `courierAwbNumber` field
4. ✅ Store in `shipments` collection

## Important Notes

1. **Credentials are encrypted**: The API endpoint automatically encrypts credentials before storing them
2. **For Shiprocket**: 
   - `apiKey` field = Shiprocket email
   - `apiSecret` field = Shiprocket password
3. **Security**: Never commit credentials to version control. Always use the API endpoint to update them.

## Troubleshooting

### Error: "Provider not found"
- Make sure the `providerId` matches exactly (case-sensitive)
- Check that the provider is enabled for the company

### Error: "Company ID must be a 6-digit numeric string"
- Ensure companyId is exactly 6 digits (e.g., "100004")

### Still getting authentication errors
- Verify your Shiprocket email and password are correct
- Check that the credentials were encrypted and stored correctly
- Check server logs for detailed error messages

