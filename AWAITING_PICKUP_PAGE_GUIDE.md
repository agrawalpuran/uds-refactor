# Awaiting Pickup Page - Implementation Guide

## Overview

A new page has been created under the vendor order management section that lists all orders with API shipments that are awaiting pickup scheduling. Vendors can schedule or reschedule pickups directly from this page.

## What Was Created

### 1. API Endpoint
**File**: `app/api/vendor/orders/awaiting-pickup/route.ts`

**Purpose**: Fetches all orders with API shipments that:
- Have `shipmentMode = 'API'`
- Have an AWB number (courierAwbNumber or trackingNumber)
- Either have no pickup scheduled OR latest pickup status is not `PICKED_UP`

**Response Format**:
```json
{
  "success": true,
  "orders": [
    {
      "orderId": "...",
      "prNumber": "...",
      "shipmentId": "...",
      "awbNumber": "...",
      "warehouse": { ... },
      "order": { ... },
      "latestPickup": { ... } | null
    }
  ],
  "count": 5
}
```

### 2. Reusable PickupModal Component
**File**: `components/shipment/PickupModal.tsx`

**Purpose**: Extracted from `PickupManagement` to be reusable across pages.

**Features**:
- Phone number validation (10 digits, no masking)
- Pre-fills warehouse contact information
- Defaults pickup date to tomorrow
- Supports both schedule and reschedule modes

### 3. Awaiting Pickup Page
**File**: `app/dashboard/vendor/orders/awaiting-pickup/page.tsx`

**Route**: `/dashboard/vendor/orders/awaiting-pickup`

**Features**:
- Table view of all orders awaiting pickup
- Shows order details (PR, PO, employee, company)
- Displays AWB number and courier
- Shows warehouse information
- Displays current pickup status (if any)
- Action buttons:
  - **Schedule Pickup**: For orders with no pickup
  - **Reschedule**: For orders with scheduled pickup (not PICKED_UP)
  - **View**: Navigate to order details page
- Auto-refresh capability
- Empty state when no orders await pickup

### 4. Navigation Menu Update
**File**: `components/DashboardLayout.tsx`

**Change**: Added "Awaiting Pickup" menu item under "Order Management" category for vendors.

**Location**: Between "Orders" and "Replacement Orders"

---

## How to Test

### Step 1: Access the Page

1. **Login as Vendor**
   - Navigate to: `http://localhost:3001/dashboard/vendor`
   - Login with vendor credentials

2. **Navigate to Awaiting Pickup Page**
   - In the sidebar, expand "Order Management"
   - Click on "Awaiting Pickup"
   - OR navigate directly to: `http://localhost:3001/dashboard/vendor/orders/awaiting-pickup`

### Step 2: Verify Page Loads

**Expected Behavior**:
- Page loads with a table showing orders awaiting pickup
- Header shows count of orders
- "Refresh" button is available
- If no orders, shows empty state message

**If Empty**:
- Ensure you have API shipments with AWB numbers
- Check that shipments have `shipmentMode = 'API'`
- Verify AWB numbers exist in shipment records

### Step 3: Test Schedule Pickup

1. **Find an Order Without Pickup**
   - Look for orders with "Not scheduled" in the Pickup Status column
   - Click "Schedule Pickup" button

2. **Verify Modal Opens**
   - Modal should show warehouse address (read-only)
   - Contact name and phone should be pre-filled
   - Pickup date should default to tomorrow
   - Time slot should default to "10:00 AM - 1:00 PM"

3. **Fill Form**
   - Optionally edit contact name/phone
   - Select a pickup date (must be future date)
   - Select time slot

4. **Submit**
   - Click "Schedule" button
   - **Expected**: Modal closes, table refreshes, pickup status changes to "SCHEDULED"

### Step 4: Test Reschedule Pickup

1. **Find an Order With Scheduled Pickup**
   - Look for orders with "SCHEDULED" or "RESCHEDULED" status
   - Click "Reschedule" button

2. **Verify Modal Pre-fills**
   - Contact name/phone from existing pickup
   - Pickup date from existing pickup
   - Time slot from existing pickup

3. **Change Details**
   - Select a different pickup date
   - Optionally change time slot

4. **Submit**
   - Click "Reschedule" button
   - **Expected**: Modal closes, table refreshes, status changes to "RESCHEDULED"

### Step 5: Test Phone Validation

1. **Open Schedule/Reschedule Modal**

2. **Enter Invalid Phone Numbers**:
   - `123456789` (9 digits) → Should show error
   - `12345678901` (11 digits) → Should show error
   - `****123456` (masked) → Should show error
   - `+91 1234567890` → Should normalize to 10 digits

3. **Enter Valid Phone**:
   - `9845154070` (10 digits) → Should accept

### Step 6: Test View Order

1. **Click "View" Button**
   - Should navigate to order details page
   - Should show full order information
   - Pickup Management section should also be visible there

### Step 7: Test Edge Cases

1. **Order Without Warehouse**
   - If warehouse is missing, "Schedule Pickup" button should be disabled
   - Should show appropriate message

2. **Pickup Already PICKED_UP**
   - Orders with `pickupStatus = 'PICKED_UP'` should show "Completed"
   - No action buttons should appear

3. **Refresh Functionality**
   - Click "Refresh" button
   - Table should reload with latest data

---

## Database Queries for Verification

### Check Orders Awaiting Pickup

```javascript
// In MongoDB Compass or shell
// Find API shipments with AWB but no pickup or pickup not PICKED_UP
db.shipments.find({
  shipmentMode: 'API',
  $or: [
    { courierAwbNumber: { $exists: true, $ne: null, $ne: '' } },
    { trackingNumber: { $exists: true, $ne: null, $ne: '' } }
  ]
}).count()
```

### Check Pickup Records

```javascript
// Find all pickups for a shipment
db.shipmentpickups.find({ shipmentId: "YOUR_SHIPMENT_ID" }).sort({ createdAt: -1 })
```

---

## Code Reuse Summary

✅ **Reused Components**:
- `PickupModal` - Extracted and reused from `PickupManagement`
- `DashboardLayout` - Standard vendor layout
- Phone validation logic - Same as in `PickupManagement`

✅ **Reused APIs**:
- `/api/shipments/[shipmentId]/pickup/schedule` - For scheduling
- `/api/shipments/[shipmentId]/pickup/reschedule` - For rescheduling
- `/api/shipments/[shipmentId]/pickup` - For fetching pickup details (used internally)

✅ **Reused Models**:
- `Shipment` - For shipment data
- `ShipmentPickup` - For pickup records
- `Order` - For order information
- `VendorWarehouse` - For warehouse details

---

## UI Features

### Table Columns

1. **Order Details**
   - PR Number
   - PO Number (if available)
   - Employee Name
   - Company Name
   - Order ID

2. **AWB / Tracking**
   - AWB Number (blue, clickable)
   - Courier Provider Code

3. **Warehouse**
   - Warehouse Name
   - Full Address
   - Contact Phone

4. **Pickup Status**
   - Current Status (color-coded badge)
   - Pickup Date
   - Time Slot (if available)

5. **Actions**
   - Schedule/Reschedule button
   - View Order button

### Status Badge Colors

- **SCHEDULED**: Blue
- **RESCHEDULED**: Orange
- **PICKED_UP**: Green
- **FAILED**: Red
- **Not scheduled**: Gray italic text

---

## Troubleshooting

### Issue: Page Shows "No Orders Awaiting Pickup" But Shipments Exist

**Check**:
1. Shipments have `shipmentMode = 'API'`
2. AWB number exists (`courierAwbNumber` or `trackingNumber`)
3. Vendor ID matches in query

**Fix**:
```javascript
// Verify shipment mode and AWB
db.shipments.findOne({ shipmentId: "YOUR_SHIPMENT_ID" })
```

### Issue: Schedule Pickup Button Disabled

**Check**:
1. Warehouse exists for the shipment
2. Warehouse has valid `warehouseRefId`

**Fix**: Ensure warehouse is properly linked to shipment

### Issue: Modal Doesn't Open

**Check**:
1. Browser console for JavaScript errors
2. Network tab for API errors
3. Verify `PickupModal` component is imported correctly

### Issue: Pickup Not Saving

**Check**:
1. Server logs for API errors
2. Phone number validation (must be 10 digits)
3. Warehouse ID is valid
4. Shipment ID exists

---

## Next Steps

1. **Test with Real Data**: Use actual API shipments with AWB numbers
2. **Monitor Performance**: Check query performance with large datasets
3. **Add Filters**: Consider adding filters (date range, status, courier)
4. **Add Bulk Actions**: Consider allowing bulk pickup scheduling
5. **Add Notifications**: Notify vendors when pickups are scheduled/rescheduled

---

## Success Criteria

✅ Page loads and displays orders awaiting pickup  
✅ Schedule Pickup works for orders without pickup  
✅ Reschedule Pickup works for orders with scheduled pickup  
✅ Phone validation blocks invalid numbers  
✅ Modal pre-fills warehouse information  
✅ Table refreshes after successful pickup scheduling  
✅ Navigation to order details works  
✅ Empty state displays when no orders await pickup  
✅ All existing functionality remains unaffected  

---

**Need Help?** Check server logs and browser console for detailed error messages.


