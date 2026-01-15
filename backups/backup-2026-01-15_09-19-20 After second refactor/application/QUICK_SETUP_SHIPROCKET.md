# Quick Setup: Add Shiprocket Credentials

## The Issue
The error "Provider PROV_SR_ICICI is not enabled for company 100004" means the provider doesn't exist yet. We need to **CREATE** it first using **POST**, not PUT.

## Solution: Use POST to Create/Update

### Step 1: Find Available Providers (Optional)

First, check what Shiprocket providers exist in the system:

```javascript
// This will show you what providers are available globally
// You can skip this if you know the providerId
fetch('/api/superadmin/shipping-providers')
  .then(r => r.json())
  .then(data => {
    console.log('📋 Available Providers:');
    if (Array.isArray(data)) {
      data.forEach(p => {
        if (p.providerCode?.includes('SHIPROCKET')) {
          console.log(`Provider ID: ${p.providerId}, Name: ${p.providerName}, Code: ${p.providerCode}`);
        }
      });
    }
  });
```

### Step 2: Create Provider with Credentials (USE POST)

**Use POST method** - it will create the provider if it doesn't exist, or update it if it does:

```javascript
// ============================================
// UPDATE THESE VALUES
// ============================================
const companyId = '100004';
const providerId = 'PROV_SR_ICICI'; // Try this first, or find the correct one from Step 1
const shiprocketEmail = 'agrawalpuran@gmail.com'; // Your Shiprocket email
const shiprocketPassword = '!d%wun0jY75pPeapvAJ9kZo#y1HYgI0r'; // Your Shiprocket password
// ============================================

fetch(`/api/companies/${companyId}/shipping-providers`, {
  method: 'POST',  // ← USE POST, NOT PUT
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    providerId: providerId,
    isEnabled: true,
    isDefault: false,
    credentials: {
      apiKey: shiprocketEmail,      // For Shiprocket: apiKey = email
      apiSecret: shiprocketPassword, // For Shiprocket: apiSecret = password
    },
    createdBy: 'Admin',
  }),
})
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.error('❌ Error:', data.error);
      if (data.error.includes('not found')) {
        console.log('💡 Tip: The providerId might be wrong. Try finding it using Step 1.');
      }
    } else {
      console.log('✅ SUCCESS! Provider created/updated:');
      console.log('   Company Shipping Provider ID:', data.companyShippingProviderId);
      console.log('   Provider:', data.providerName);
      console.log('   Code:', data.providerCode);
      console.log('   Enabled:', data.isEnabled);
      console.log('\n✅ You can now create shipments!');
    }
  })
  .catch(err => console.error('❌ Request failed:', err));
```

## What's the Difference?

- **POST**: Creates the provider if it doesn't exist, or updates it if it does ✅ (Use this!)
- **PUT**: Only updates if the provider already exists ❌ (Won't work if provider doesn't exist)

## After Success

1. ✅ Provider is created and enabled
2. ✅ Credentials are encrypted and stored
3. ✅ Try creating a shipment - it should work now!

## Troubleshooting

### Error: "Provider PROV_SR_ICICI not found or not active"
- The `providerId` might be wrong
- Run Step 1 to find the correct providerId
- Common providerIds: `PROV_SHIPROCKET`, `PROV_SR_ICICI`, `PROV_SR_1`

### Still getting errors?
- Make sure the server is running
- Check browser console for detailed error messages
- Verify your Shiprocket email and password are correct
