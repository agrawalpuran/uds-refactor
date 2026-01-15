# Shiprocket Integration Setup Guide

## Overview

This guide explains how to configure and test Shiprocket logistics provider integration in UDS.

## Authentication

Shiprocket uses email/password authentication that returns a JWT token valid for **240 hours (10 days)**.

### API Endpoint
- **Base URL**: `https://apiv2.shiprocket.in`
- **Auth Endpoint**: `/v1/external/auth/login`
- **Method**: POST

### Authentication Request

```json
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

### Authentication Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "your_email@example.com",
  "id": 9037679,
  "company_id": 3143965,
  "first_name": "API",
  "last_name": "USER",
  "created_at": "2026-01-02 18:47:35"
}
```

## Step 1: Configure Shiprocket Provider (Super Admin)

The Shiprocket provider has been automatically created:
- **Provider ID**: `PROV_SR_MJWWX5NU`
- **Provider Code**: `SHIPROCKET`
- **Provider Name**: `Shiprocket`
- **API Base URL**: `https://apiv2.shiprocket.in`
- **Auth Type**: `TOKEN` (email/password → token)

## Step 2: Test Authentication

### Via PowerShell

```powershell
$body = @{
    testType = "health"
    email = "agrawalpuran@gmail.com"
    password = "!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/test/shipway?providerCode=SHIPROCKET" `
    -Method POST -ContentType "application/json" -Body $body
```

### Via Test Script

```powershell
.\scripts\test-shiprocket-integration.ps1
```

## Step 3: Test Shipment Creation

### Sample Payload

```json
{
  "testType": "create",
  "email": "agrawalpuran@gmail.com",
  "password": "!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr",
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
      "phone": "9876543210",
      "email": "vendor@test.com"
    },
    "toAddress": {
      "name": "Test Employee",
      "address": "456 Employee Lane",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400070",
      "phone": "9876543211",
      "email": "employee@test.com"
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
}
```

## Shiprocket API Mapping

### UDS → Shiprocket Field Mapping

| UDS Field | Shiprocket Field | Notes |
|-----------|------------------|-------|
| `prNumber` | `order_id` | PR/Order identifier |
| `fromAddress.name` | `billing_customer_name` | Split into first/last name |
| `fromAddress.address` | `billing_address` | Sender address |
| `fromAddress.city` | `billing_city` | Sender city |
| `fromAddress.state` | `billing_state` | Sender state |
| `fromAddress.pincode` | `billing_pincode` | Sender pincode |
| `fromAddress.phone` | `billing_phone` | Sender phone |
| `toAddress.*` | `shipping_*` | Recipient fields (same pattern) |
| `items[].productName` | `order_items[].name` | Product name |
| `items[].quantity` | `order_items[].units` | Quantity |
| `items[].weight` | `weight` (total) | Total weight |
| `paymentMode` | `payment_method` | 'PREPAID' → 'Prepaid', 'COD' → 'COD' |
| `shipmentValue` | `sub_total` | Total shipment value |

### Shiprocket → UDS Status Mapping

| Shiprocket Status | UDS Status | Notes |
|-------------------|------------|-------|
| `NEW`, `PROCESSING` | `CREATED` | Order created |
| `READY_TO_SHIP`, `PICKED_UP` | `IN_TRANSIT` | In transit |
| `DELIVERED`, `COMPLETED` | `DELIVERED` | Delivered |
| `CANCELLED`, `RTO` | `FAILED` | Failed/Cancelled |

## API Endpoints

### Create Shipment
- **Endpoint**: `/v1/external/orders/create/adhoc`
- **Method**: POST
- **Auth**: Bearer token (from login)

### Get Shipment Status
- **Endpoint**: `/v1/external/orders/show/{order_id}`
- **Method**: GET
- **Auth**: Bearer token

### Check Serviceability
- **Endpoint**: `/v1/external/courier/serviceability/`
- **Method**: GET
- **Params**: `postal_code`, `pickup_postal_code` (optional)
- **Auth**: Bearer token

### Cancel Shipment
- **Endpoint**: `/v1/external/orders/cancel/shipment/awbs`
- **Method**: POST
- **Body**: `{ "awbs": ["AWB_CODE"] }`
- **Auth**: Bearer token

## Token Management

- **Token Validity**: 240 hours (10 days)
- **Auto-Refresh**: Token is automatically refreshed when expired
- **Storage**: Token is cached in provider instance during session
- **Production**: Store credentials encrypted in `CompanyShippingProvider` table

## Testing

### Quick Test

```powershell
# Health Check
$body = '{"testType":"health","email":"agrawalpuran@gmail.com","password":"!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr"}'
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/test/shipway?providerCode=SHIPROCKET" `
    -Method POST -ContentType "application/json" -Body $body
```

### Full Test Suite

```powershell
.\scripts\test-shiprocket-integration.ps1
```

## Configuration

### Environment Variables (Optional, for testing)

Add to `.env.local`:

```env
SHIPROCKET_EMAIL=agrawalpuran@gmail.com
SHIPROCKET_PASSWORD=!d%wun0jY75pPeapvAJ9kZo#ylHYgIOr
```

**Note**: In production, credentials should be stored encrypted in `CompanyShippingProvider` table, not in environment variables.

## Next Steps

1. ✅ Shiprocket provider is configured
2. ✅ Authentication tested and working
3. Test serviceability check
4. Test shipment creation with real order
5. Configure CompanyShippingProvider with encrypted credentials
6. Test end-to-end shipment flow

## API Documentation

- **Shiprocket API Docs**: https://apidocs.shiprocket.in/
- **Support**: Check Shiprocket dashboard for API user management

## Current Status

✅ **Provider Created**: `PROV_SR_MJWWX5NU`  
✅ **Authentication**: Working (token received)  
✅ **Health Check**: Passing  
⏳ **Serviceability**: Ready to test  
⏳ **Shipment Creation**: Ready to test  

