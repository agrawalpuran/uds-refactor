# Pickup Scheduling Feature - Testing Guide

This guide provides step-by-step instructions to test the pickup scheduling and rescheduling feature.

## Prerequisites

Before testing, ensure:

1. ✅ **Server is running**: `npm run dev` (should be running on port 3001)
2. ✅ **MongoDB is connected**: Check server logs for "✅ MongoDB Connected Successfully"
3. ✅ **Shiprocket credentials configured**: Provider must have valid email/password
4. ✅ **Company shipping mode is AUTOMATIC**: Company must be configured for API shipments
5. ✅ **Vendor has warehouse configured**: Warehouse with valid address and contact phone

---

## Step 1: Create a Test Shipment (API-Backed with AWB)

### Option A: Create via UI (Recommended)

1. **Login as Vendor**
   - Navigate to: `http://localhost:3001/dashboard/vendor`
   - Login with vendor credentials

2. **Navigate to Orders**
   - Go to Orders page
   - Find an order with status `PO_CREATED` or `IN_FULFILMENT`

3. **Create Shipment**
   - Click on the order to view details
   - Click "Create Shipment" button
   - Fill in required fields:
     - **Shipment Package**: Select a package (mandatory)
     - **Pickup Phone**: Should be pre-filled from warehouse (editable)
     - **Recipient Phone**: Should be pre-filled from employee (editable)
     - **Dispatch Date**: Defaults to today
   - Click "Create Shipment"

4. **Verify Shipment Created**
   - Check that shipment is created successfully
   - **IMPORTANT**: Verify that AWB number is displayed
   - Note down the `shipmentId` from the response

### Option B: Use Existing Shipment

1. **Find Existing API Shipment**
   - Go to order details page
   - Look for shipments with:
     - `shipmentMode = 'API'`
     - `courierAwbNumber` or `trackingNumber` exists
     - `shipmentStatus = 'CREATED'`

2. **Note Shipment Details**
   - Copy the `shipmentId`
   - Copy the `awbNumber` (courierAwbNumber or trackingNumber)
   - Copy the `orderId` (to navigate to order details page)

---

## Step 2: Navigate to Order Details Page

1. **Open Order Details**
   - Navigate to: `http://localhost:3001/dashboard/vendor/orders/[orderId]`
   - Replace `[orderId]` with your test order ID

2. **Verify Shipment Details Section**
   - Scroll down to "Shipment Details" section
   - Verify shipment information is displayed

3. **Look for Pickup Management Section**
   - **Expected**: "Pickup Management" section should appear **BELOW** "Shipment Details"
   - **Only appears if**:
     - `shipmentMode = 'API'`
     - AWB number exists
   - **Should NOT appear** if shipment is MANUAL or AWB is missing

---

## Step 3: Test Pickup Management Display

### Verify Display Elements

1. **Check Section Header**
   - Should show: "Pickup Management" with truck icon
   - Should show action button:
     - "Schedule Pickup" (if no pickup exists)
     - "Reschedule Pickup" (if pickup exists and not PICKED_UP)

2. **Check Information Display**
   - **Shipping Aggregator**: Should show provider name (e.g., "Shiprocket")
   - **Courier**: Should show courier code (e.g., "DTDC")
   - **AWB Number**: Should show the AWB number
   - **Warehouse Pickup Address**: Should show full warehouse address
   - **Pickup Status**: Should show current status (if pickup exists)
   - **Last Pickup Date/Time**: Should show scheduled date/time (if pickup exists)

3. **If No Pickup Exists**
   - Should show message: "No pickup scheduled yet. Click 'Schedule Pickup' to schedule a pickup."

---

## Step 4: Test Schedule Pickup

### Test Case 1: Valid Pickup Scheduling

1. **Click "Schedule Pickup" Button**
   - Modal should open
   - Title: "Schedule Pickup"

2. **Verify Pre-filled Data**
   - **Warehouse Address**: Should be pre-filled (read-only)
   - **Contact Name**: Should be pre-filled from warehouse (editable)
   - **Contact Phone**: Should be pre-filled from warehouse (editable)
   - **Pickup Date**: Should default to tomorrow (next working day)
   - **Pickup Time Slot**: Should default to "10:00 AM - 1:00 PM"

3. **Fill Form (Optional Edits)**
   - Edit Contact Name if needed
   - Edit Contact Phone if needed
   - Change Pickup Date if needed (must be future date)
   - Select different Time Slot if needed

4. **Submit Form**
   - Click "Schedule" button
   - **Expected**: 
     - Loading state: "Processing..."
     - Success: Modal closes, pickup data refreshes
     - New pickup status shown: "SCHEDULED"

5. **Verify in Database** (Optional)
   ```javascript
   // In MongoDB shell or Compass
   db.shipmentpickups.find({ shipmentId: "YOUR_SHIPMENT_ID" }).sort({ createdAt: -1 }).limit(1)
   ```
   - Should see new record with:
     - `pickupStatus: "SCHEDULED"`
     - `pickupDate`: Your selected date
     - `contactPhone`: Normalized 10-digit phone
     - `rawProviderResponse`: Full Shiprocket API response

### Test Case 2: Phone Validation (Invalid Phone)

1. **Open Schedule Pickup Modal**

2. **Enter Invalid Phone Numbers** (one at a time):
   - **Masked**: `****123456` or `XXXX123456`
   - **Too Short**: `123456789` (9 digits)
   - **Too Long**: `12345678901` (11 digits)
   - **With Spaces**: `123 456 7890`
   - **With Country Code**: `+91 1234567890`
   - **With Leading Zero**: `0123456789`

3. **Click "Schedule"**
   - **Expected**: 
     - Form does NOT submit
     - Error message appears: "Phone number must be exactly 10 digits"
     - API call is NOT made

4. **Enter Valid Phone**
   - Enter: `9845154070` (10 digits)
   - **Expected**: Error clears, form can be submitted

### Test Case 3: Required Field Validation

1. **Open Schedule Pickup Modal**

2. **Clear Required Fields**:
   - Clear Contact Name
   - Clear Contact Phone
   - Clear Pickup Date

3. **Click "Schedule"**
   - **Expected**: 
     - Form does NOT submit
     - Error messages appear for missing fields
     - API call is NOT made

---

## Step 5: Test Reschedule Pickup

### Prerequisites
- A pickup must already be scheduled (from Step 4)

### Test Case 1: Valid Rescheduling

1. **Verify Reschedule Button Appears**
   - Should see "Reschedule Pickup" button (orange)
   - Should NOT see "Schedule Pickup" button

2. **Click "Reschedule Pickup"**
   - Modal should open
   - Title: "Reschedule Pickup"

3. **Verify Pre-filled Data**
   - **Contact Name**: Should be pre-filled from existing pickup
   - **Contact Phone**: Should be pre-filled from existing pickup
   - **Pickup Date**: Should be pre-filled from existing pickup (editable)
   - **Pickup Time Slot**: Should be pre-filled from existing pickup

4. **Change Pickup Date**
   - Select a different future date
   - Optionally change time slot

5. **Submit Form**
   - Click "Reschedule" button
   - **Expected**:
     - Loading state: "Processing..."
     - Success: Modal closes, pickup data refreshes
     - Pickup status changes to: "RESCHEDULED"

6. **Verify in Database**
   - Should see NEW record (old record preserved for history)
   - New record has:
     - `pickupStatus: "RESCHEDULED"`
     - Updated `pickupDate`
     - Same `shipmentId` (linked to same shipment)

### Test Case 2: Reschedule with Invalid Phone

1. **Open Reschedule Modal**

2. **Enter Invalid Phone**: `123456789` (9 digits)

3. **Click "Reschedule"**
   - **Expected**: 
     - Error: "Phone number must be exactly 10 digits"
     - API call is NOT made

---

## Step 6: Test Error Scenarios

### Test Case 1: Pickup Already PICKED_UP

1. **Manually Update Pickup Status** (in database):
   ```javascript
   db.shipmentpickups.updateOne(
     { shipmentId: "YOUR_SHIPMENT_ID" },
     { $set: { pickupStatus: "PICKED_UP" } }
   )
   ```

2. **Refresh Order Details Page**

3. **Expected**:
   - "Reschedule Pickup" button should NOT appear
   - Pickup status shows: "PICKED_UP"
   - Message indicates pickup is complete

### Test Case 2: API Failure (Simulate)

1. **Temporarily Break Shiprocket Credentials**
   - Update CompanyShippingProvider with invalid email/password
   - Or disconnect internet

2. **Try to Schedule Pickup**

3. **Expected**:
   - Error message displayed: "Failed to schedule pickup: [error details]"
   - Shipment/Order status does NOT change
   - No pickup record created (or created with FAILED status)

### Test Case 3: MANUAL Shipment (Should Not Show)

1. **Find a MANUAL Shipment**
   - Order with `shipmentMode = 'MANUAL'`

2. **Navigate to Order Details**

3. **Expected**:
   - "Pickup Management" section should NOT appear
   - Only "Shipment Details" section visible

### Test Case 4: Missing AWB

1. **Find API Shipment Without AWB**
   - Or manually remove AWB from shipment in database

2. **Navigate to Order Details**

3. **Expected**:
   - "Pickup Management" section should NOT appear
   - Error in console: "AWB number is required for pickup scheduling"

---

## Step 7: Verify API Endpoints Directly (Optional)

### Test Schedule Pickup API

```bash
# Using curl or Postman
POST http://localhost:3001/api/shipments/[shipmentId]/pickup/schedule
Content-Type: application/json

{
  "warehouseId": "WH_XXXXX",
  "contactName": "John Doe",
  "contactPhone": "9845154070",
  "pickupDate": "2026-01-06",
  "pickupTimeSlot": "10:00-13:00"
}
```

**Expected Response (Success)**:
```json
{
  "success": true,
  "pickupId": "PICKUP_XXXXX",
  "pickupReferenceId": "12345",
  "pickupDate": "2026-01-06T00:00:00.000Z",
  "pickupTimeSlot": "10:00-13:00",
  "pickupStatus": "SCHEDULED",
  "message": "Pickup scheduled successfully"
}
```

**Expected Response (Error - Invalid Phone)**:
```json
{
  "error": "Phone number must be exactly 10 digits after normalization. Got: 9 digits from \"123456789\"",
  "field": "contactPhone"
}
```

### Test Reschedule Pickup API

```bash
PUT http://localhost:3001/api/shipments/[shipmentId]/pickup/reschedule
Content-Type: application/json

{
  "warehouseId": "WH_XXXXX",
  "contactName": "John Doe",
  "contactPhone": "9845154070",
  "pickupDate": "2026-01-07",
  "pickupTimeSlot": "13:00-16:00"
}
```

### Test Get Pickup Details API

```bash
GET http://localhost:3001/api/shipments/[shipmentId]/pickup
```

**Expected Response**:
```json
{
  "success": true,
  "shipment": {
    "shipmentId": "SHIP_XXXXX",
    "shipmentMode": "API",
    "awbNumber": "7D123950995",
    "courierProviderCode": "DTDC",
    "shipmentStatus": "CREATED"
  },
  "latestPickup": {
    "pickupId": "PICKUP_XXXXX",
    "pickupStatus": "SCHEDULED",
    "pickupDate": "2026-01-06T00:00:00.000Z",
    "pickupTimeSlot": "10:00-13:00",
    "contactName": "John Doe",
    "contactPhone": "9845154070"
  },
  "warehouse": { ... },
  "provider": { ... }
}
```

---

## Step 8: Verify Database Records

### Check ShipmentPickup Collection

```javascript
// In MongoDB Compass or shell
db.shipmentpickups.find({ shipmentId: "YOUR_SHIPMENT_ID" }).sort({ createdAt: -1 })
```

**Expected**:
- Multiple records if rescheduled (history preserved)
- Latest record has most recent `createdAt`
- All records linked to same `shipmentId`
- `rawProviderResponse` contains full Shiprocket API response

### Verify Shipment Record (Should NOT Change)

```javascript
db.shipments.findOne({ shipmentId: "YOUR_SHIPMENT_ID" })
```

**Expected**:
- `shipmentStatus` remains unchanged (e.g., "CREATED")
- `shipmentMode` remains "API"
- No pickup-related fields added (pickup data is in separate collection)

---

## Step 9: Check Server Logs

Monitor terminal where `npm run dev` is running for:

1. **Pickup Scheduling Logs**:
   ```
   [API /shipments/[shipmentId]/pickup/schedule] Scheduling pickup via SHIPROCKET
   [ShiprocketProvider] Scheduling pickup for AWB: 7D123950995
   [ShiprocketProvider] Pickup payload: {...}
   [ShiprocketProvider] Pickup schedule response: {...}
   [API /shipments/[shipmentId]/pickup/schedule] ✅ Pickup scheduled successfully: PICKUP_XXXXX
   ```

2. **Error Logs** (if any):
   ```
   [API /shipments/[shipmentId]/pickup/schedule] Pickup scheduling failed: ...
   ```

3. **Phone Validation Logs**:
   ```
   [createApiShipment] ✅ Normalized sender phone: 9845154070 (from: ...)
   ```

---

## Step 10: Test Edge Cases

### Edge Case 1: Multiple Reschedules

1. Schedule pickup → Status: SCHEDULED
2. Reschedule pickup → Status: RESCHEDULED
3. Reschedule again → Status: RESCHEDULED (new record)
4. **Verify**: All 3 records exist in database (history preserved)

### Edge Case 2: Pickup Date on Weekend/Holiday

1. Schedule pickup for Sunday
2. **Expected**: Shiprocket may auto-adjust to next working day
3. Check `rawProviderResponse` for actual scheduled date

### Edge Case 3: Warehouse Missing

1. Try to schedule pickup with invalid `warehouseId`
2. **Expected**: Error: "Warehouse [warehouseId] not found"

---

## Troubleshooting

### Issue: Pickup Management Section Not Appearing

**Check**:
1. Is `shipmentMode = 'API'`? (Check shipment record)
2. Does AWB number exist? (Check `courierAwbNumber` or `trackingNumber`)
3. Check browser console for errors
4. Check server logs for API errors

### Issue: Phone Validation Failing

**Check**:
1. Phone number format (must be exactly 10 digits after normalization)
2. No special characters, spaces, or country codes
3. Check server logs for normalization details

### Issue: API Call Failing

**Check**:
1. Shiprocket credentials are valid (email/password)
2. Provider is enabled for company
3. Check `rawProviderResponse` in database for error details
4. Verify Shiprocket API is accessible

### Issue: Pickup Not Showing in UI

**Check**:
1. Refresh the page
2. Check browser console for API errors
3. Verify pickup record exists in database
4. Check `GET /api/shipments/[shipmentId]/pickup` endpoint directly

---

## Success Criteria

✅ Pickup Management section appears for API shipments with AWB  
✅ Schedule Pickup button works and creates pickup record  
✅ Reschedule Pickup button works and creates new record  
✅ Phone validation blocks invalid numbers  
✅ Error messages are clear and helpful  
✅ Pickup failures do NOT affect shipment/order status  
✅ Manual shipments remain unaffected  
✅ All pickup attempts are logged in database  

---

## Next Steps After Testing

1. **Verify Shiprocket Dashboard**: Check if pickup appears in Shiprocket panel
2. **Test with Real Pickup**: Wait for actual pickup date and verify status updates
3. **Monitor Logs**: Check for any edge cases or errors
4. **User Acceptance**: Get feedback from vendors on UI/UX

---

## Quick Test Checklist

- [ ] Create API shipment with AWB
- [ ] Navigate to order details page
- [ ] Verify Pickup Management section appears
- [ ] Test Schedule Pickup with valid data
- [ ] Test phone validation (invalid numbers)
- [ ] Test Reschedule Pickup
- [ ] Verify database records created
- [ ] Test error scenarios
- [ ] Verify MANUAL shipments don't show pickup section
- [ ] Check server logs for errors

---

**Need Help?** Check server logs and browser console for detailed error messages.


