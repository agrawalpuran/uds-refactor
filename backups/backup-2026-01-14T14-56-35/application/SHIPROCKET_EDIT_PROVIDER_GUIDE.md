# Shiprocket Provider - Edit Provider Form Entries

## Complete Form Configuration Guide

This guide provides the exact entries for the "Edit Provider" page to configure Shiprocket correctly.

---

## 📋 BASIC INFORMATION

### Provider Code
```
SHIPROCKET
```
- **Note**: This field is disabled when editing (cannot be changed)

### Provider Name
```
Shiprocket
```

### Provider Type
```
API Aggregator
```
- Select from dropdown: **API Aggregator**

---

## 🔗 API CONFIGURATION

### API Base URL
```
https://apiv2.shiprocket.in
```

### API Version
```
v1
```

### Auth Type (Legacy Field)
```
Token
```
- Select from dropdown: **Token**
- **Note**: This is a legacy field. The actual authentication is configured in the Authentication Configuration section below.

### Documentation URL
```
https://apidocs.shiprocket.in/
```

---

## ✅ CAPABILITIES (Checkboxes)

Enable the following capabilities:

- ✅ **Create Shipment** - Check this box
- ✅ **Tracking** - Check this box
- ✅ **Serviceability Check** - Check this box
- ✅ **Cancellation** - Check this box
- ❌ **Webhooks** - Leave unchecked (Shiprocket doesn't support webhooks in this setup)

---

## 🔐 AUTHENTICATION CONFIGURATION

**Click "Show" to expand the Authentication Configuration section**

### Authentication Type
```
Basic Auth
```
- Select from dropdown: **Basic Auth**

### Username (Email)
```
agrawalpuran@gmail.com
```
- **Note**: This is your Shiprocket account email
- Enter in the "Username" field (password input type)

### Password
```
!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr
```
- **Note**: This is your Shiprocket account password
- Enter in the "Password" field (password input type)

### Auto-refresh Token
```
✅ Check this box
```
- Enable auto-refresh token (Shiprocket tokens expire after 240 hours)

---

## ⚙️ STATUS

### Active
```
✅ Check this box
```
- Provider must be active to be used

---

## 📝 STEP-BY-STEP INSTRUCTIONS

### Step 1: Navigate to Edit Provider Page
1. Go to: **Super Admin → Logistics & Shipping → Service Providers**
2. Find **Shiprocket** in the providers list
3. Click the **Edit** icon (pencil) next to Shiprocket

### Step 2: Fill Basic Information
1. **Provider Code**: `SHIPROCKET` (already filled, disabled)
2. **Provider Name**: `Shiprocket`
3. **Provider Type**: Select `API Aggregator` from dropdown

### Step 3: Configure API Settings
1. **API Base URL**: `https://apiv2.shiprocket.in`
2. **API Version**: `v1`
3. **Auth Type**: Select `Token` from dropdown
4. **Documentation URL**: `https://apidocs.shiprocket.in/`

### Step 4: Enable Capabilities
Check the following boxes:
- ✅ Create Shipment
- ✅ Tracking
- ✅ Serviceability Check
- ✅ Cancellation
- ❌ Webhooks (leave unchecked)

### Step 5: Configure Authentication
1. Scroll down to **"Authentication Configuration"** section
2. Click **"Show"** button to expand
3. **Authentication Type**: Select `Basic Auth` from dropdown
4. **Username**: Enter `agrawalpuran@gmail.com`
5. **Password**: Enter `!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr`
6. **Auto-refresh Token**: Check the box ✅

### Step 6: Verify Status
1. Ensure **"Active"** checkbox is checked ✅

### Step 7: Test Connection
1. Click **"Test Connection"** button (visible when Authentication Configuration is expanded)
2. Wait for the test to complete
3. You should see: **"✅ Connection successful!"**
4. If successful, the health status will be updated to "Healthy"

### Step 8: Save Configuration
1. Click **"Update"** button at the bottom
2. You should see: **"Provider updated successfully!"**

---

## ✅ VERIFICATION CHECKLIST

After saving, verify:

- [ ] Provider Code: `SHIPROCKET`
- [ ] Provider Name: `Shiprocket`
- [ ] Provider Type: `API Aggregator`
- [ ] API Base URL: `https://apiv2.shiprocket.in`
- [ ] API Version: `v1`
- [ ] Capabilities: Create, Track, Serviceability, Cancellation enabled
- [ ] Authentication: Shows "✅ Authentication Configured"
- [ ] Status: Active
- [ ] Health Status: Healthy (after test connection)

---

## 🔍 TROUBLESHOOTING

### If "Test Connection" Fails:

1. **Check Credentials**
   - Verify email: `agrawalpuran@gmail.com`
   - Verify password: `!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr`
   - Ensure no extra spaces

2. **Check API Base URL**
   - Should be exactly: `https://apiv2.shiprocket.in`
   - No trailing slashes

3. **Check Network**
   - Ensure server can reach `https://apiv2.shiprocket.in`
   - Check firewall settings

4. **Check Provider Status**
   - Ensure provider is marked as "Active"

### Common Errors:

- **"Authentication not configured"**
  - Solution: Expand Authentication Configuration section and enter credentials

- **"Provider not found or inactive"**
  - Solution: Ensure provider is marked as Active

- **"Connection failed"**
  - Solution: Verify credentials and API Base URL are correct

---

## 📊 EXPECTED VALUES SUMMARY

| Field | Value |
|-------|-------|
| Provider Code | `SHIPROCKET` |
| Provider Name | `Shiprocket` |
| Provider Type | `API Aggregator` |
| API Base URL | `https://apiv2.shiprocket.in` |
| API Version | `v1` |
| Auth Type (Legacy) | `Token` |
| Documentation URL | `https://apidocs.shiprocket.in/` |
| Create Shipment | ✅ Enabled |
| Tracking | ✅ Enabled |
| Serviceability Check | ✅ Enabled |
| Cancellation | ✅ Enabled |
| Webhooks | ❌ Disabled |
| Authentication Type | `Basic Auth` |
| Username (Email) | `agrawalpuran@gmail.com` |
| Password | `!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr` |
| Auto-refresh Token | ✅ Enabled |
| Active | ✅ Enabled |

---

## 🎯 QUICK REFERENCE

**Navigation Path:**
```
Super Admin → Logistics & Shipping → Service Providers → Edit Shiprocket
```

**Critical Fields:**
- Provider Code: `SHIPROCKET`
- API Base URL: `https://apiv2.shiprocket.in`
- Username: `agrawalpuran@gmail.com`
- Password: `!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr`
- Authentication Type: `Basic Auth`

---

## ✅ AFTER CONFIGURATION

Once configured and tested:

1. ✅ Credentials are encrypted and stored securely
2. ✅ System will automatically authenticate for all operations
3. ✅ Token will auto-refresh when expired (240 hours)
4. ✅ No need to enter credentials manually for each operation
5. ✅ Health status will be updated after each test

---

## 📞 SUPPORT

If you encounter issues:
1. Check the health status in the providers list
2. Review the test connection error message
3. Verify credentials are correct
4. Ensure API Base URL is accessible

