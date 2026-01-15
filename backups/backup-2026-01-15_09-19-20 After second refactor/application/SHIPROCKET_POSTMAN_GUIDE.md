# Shiprocket API - Postman Guide

This guide shows you how to call Shiprocket API directly through Postman to fetch AWB details.

## Prerequisites

- Shiprocket API credentials (email and password)
- Postman installed
- Shiprocket API Base URL: `https://apiv2.shiprocket.in`

---

## Step 1: Authenticate and Get Token

### Request Configuration

**Method:** `POST`

**URL:**
```
https://apiv2.shiprocket.in/v1/external/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "your-email@shiprocket.com",
  "password": "your-password"
}
```

### Expected Response (200 OK):
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "email": "your-email@shiprocket.com",
  "id": 12345,
  "company_id": 67890,
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-01 00:00:00"
}
```

**Important:** Copy the `token` value - you'll need it for all subsequent requests.

---

## Step 2: Get Order Details (to find AWB)

### Request Configuration

**Method:** `GET`

**URL:**
```
https://apiv2.shiprocket.in/v1/external/orders/show/{order_id}
```

Replace `{order_id}` with your Shiprocket order ID (e.g., `1114626838`)

**Headers:**
```
Authorization: Bearer {your_token_here}
Content-Type: application/json
```

**Example:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Expected Response (200 OK):
```json
{
  "order_id": 1114626838,
  "order_date": "2024-01-05 12:00:00",
  "pickup_location": "Primary",
  "billing_customer_name": "Vendor Name",
  "billing_address": "Address Line 1",
  "billing_city": "Mumbai",
  "billing_state": "Maharashtra",
  "billing_pincode": "400001",
  "billing_country": "India",
  "billing_email": "vendor@example.com",
  "billing_phone": "9845154070",
  "shipping_customer_name": "Recipient Name",
  "shipping_address": "Address Line 1",
  "shipping_city": "Chennai",
  "shipping_state": "Tamil Nadu",
  "shipping_pincode": "600017",
  "shipping_country": "India",
  "shipping_email": "recipient@example.com",
  "shipping_phone": "8197077749",
  "order_items": [...],
  "payment_method": "Prepaid",
  "sub_total": 1000,
  "length": 40,
  "breadth": 20,
  "height": 6,
  "weight": 0.96,
  "awb_code": "788830567028",  // <-- AWB NUMBER HERE
  "courier_name": "DTDC",
  "shipment_id": 12345678,
  "status": "READY_TO_SHIP",
  "status_code": 1,
  "tracking_number": "788830567028",
  "tracking_url": "https://shiprocket.co/tracking/788830567028"
}
```

**Key Fields:**
- `awb_code`: The AWB number
- `tracking_number`: Usually same as AWB
- `shipment_id`: Used for AWB assignment
- `status`: Current shipment status

---

## Step 3: Track AWB Directly (Alternative Method)

If you already have the AWB code, you can track it directly:

### Request Configuration

**Method:** `GET`

**URL:**
```
https://apiv2.shiprocket.in/v1/external/courier/track/awb/{awb_code}
```

Replace `{awb_code}` with your AWB number (e.g., `788830567028`)

**Headers:**
```
Authorization: Bearer {your_token_here}
Content-Type: application/json
```

### Expected Response (200 OK):
```json
{
  "awb_code": "788830567028",
  "courier_name": "DTDC",
  "tracking_data": {
    "tracking_number": "788830567028",
    "shipment_status": "IN_TRANSIT",
    "status": "In Transit",
    "current_location": "Mumbai",
    "estimated_delivery_date": "2024-01-10"
  }
}
```

---

## Step 4: Assign AWB (if not already assigned)

If AWB is not assigned yet, you can assign it:

### Request Configuration

**Method:** `POST`

**URL:**
```
https://apiv2.shiprocket.in/v1/external/courier/assign/awb
```

**Headers:**
```
Authorization: Bearer {your_token_here}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "shipment_id": 12345678,
  "courier_id": 6
}
```

**Parameters:**
- `shipment_id`: Get this from Step 2 (order details response)
- `courier_id`: Optional - specific courier ID (e.g., 6 for DTDC)

### Expected Response (200 OK):
```json
{
  "awb_code": "788830567028",
  "courier_name": "DTDC",
  "response": {
    "awb_code": "788830567028",
    "courier_name": "DTDC"
  }
}
```

---

## Postman Collection Setup

### Create Environment Variables

1. Click the gear icon (top right) in Postman
2. Click "Add" to create new environment
3. Name it "Shiprocket API"
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `https://apiv2.shiprocket.in` | `https://apiv2.shiprocket.in` |
| `token` | (leave empty) | (will be set after login) |
| `order_id` | `1114626838` | `1114626838` |
| `awb_code` | (leave empty) | (will be set after fetching) |
| `shipment_id` | (leave empty) | (will be set after fetching) |

### Request 1: Login

**Method:** `POST`

**URL:**
```
{{base_url}}/v1/external/auth/login
```

**Body:**
```json
{
  "email": "your-email@shiprocket.com",
  "password": "your-password"
}
```

**Tests Tab (to auto-save token):**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    console.log("Token saved:", jsonData.token);
}
```

### Request 2: Get Order Details

**Method:** `GET`

**URL:**
```
{{base_url}}/v1/external/orders/show/{{order_id}}
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Tests Tab (to auto-save AWB and shipment_id):**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.awb_code) {
        pm.environment.set("awb_code", jsonData.awb_code);
        console.log("AWB Code:", jsonData.awb_code);
    }
    if (jsonData.shipment_id) {
        pm.environment.set("shipment_id", jsonData.shipment_id);
        console.log("Shipment ID:", jsonData.shipment_id);
    }
}
```

### Request 3: Track AWB

**Method:** `GET`

**URL:**
```
{{base_url}}/v1/external/courier/track/awb/{{awb_code}}
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

## Quick Reference

### Base URL
```
https://apiv2.shiprocket.in
```

### Authentication Endpoint
```
POST /v1/external/auth/login
```

### Get Order Details
```
GET /v1/external/orders/show/{order_id}
```

### Track AWB
```
GET /v1/external/courier/track/awb/{awb_code}
```

### Assign AWB
```
POST /v1/external/courier/assign/awb
```

### All Endpoints Require:
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## Troubleshooting

### 401 Unauthorized
- Token expired or invalid
- Solution: Re-authenticate (Step 1)

### 404 Not Found
- Order ID or AWB code doesn't exist
- Solution: Verify the ID/code is correct

### 403 Forbidden
- Account doesn't have permission
- Solution: Check Shiprocket account permissions

### 422 Unprocessable Entity
- Invalid request data
- Solution: Check request body format

---

## Example Workflow

1. **Login** → Get token
2. **Get Order Details** → Find `shipment_id` and `awb_code`
3. **If AWB missing** → **Assign AWB** using `shipment_id`
4. **Track AWB** → Get tracking details

---

## Notes

- Token expires after 240 hours (10 days)
- Store token securely (use Postman environment variables)
- AWB may not be immediately available after order creation
- Use `shipment_id` for AWB assignment, not `order_id`

