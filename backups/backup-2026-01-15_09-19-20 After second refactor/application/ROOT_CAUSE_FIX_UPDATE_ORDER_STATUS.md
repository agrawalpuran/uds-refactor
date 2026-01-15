# Root Cause Fix: updateOrderStatus() Enhancement

## Problem Statement

When vendors marked orders as "Shipped" or "Delivered" via the vendor UI, the database was only updating the basic `status` field. This caused:
- Orders not being eligible for GRN creation
- Missing shipment/delivery tracking data
- PO status not updating correctly

## Root Cause

The `updateOrderStatus()` function in `lib/db/data-access.ts` was only updating:
- `order.status = 'Dispatched'` or `'Delivered'`

It was **NOT** updating:
- `dispatchStatus` (remained `AWAITING_FULFILMENT`)
- `deliveryStatus` (remained `NOT_DELIVERED`)
- Item-level `dispatchedQuantity` (remained `0`)
- Item-level `deliveredQuantity` (remained `0`)
- `dispatchedDate` / `deliveredDate` (not set)
- `itemShipmentStatus` (not set)

## Solution Implemented

Enhanced `updateOrderStatus()` to automatically set all required fields when status is changed to "Dispatched" or "Delivered".

### When Status = "Dispatched"

The function now automatically:
1. Sets `dispatchStatus = 'SHIPPED'`
2. Sets `dispatchedDate = new Date()` (if not already set)
3. Updates all items:
   - Sets `dispatchedQuantity = quantity` (if not already set)
   - Sets `itemShipmentStatus = 'DISPATCHED'` (or 'DELIVERED' if already delivered)
   - Preserves existing `deliveredQuantity` if set

### When Status = "Delivered"

The function now automatically:
1. Sets `deliveryStatus = 'DELIVERED'`
2. Sets `deliveredDate = new Date()` (if not already set)
3. Ensures `dispatchStatus = 'SHIPPED'` (if not already set)
4. Sets `dispatchedDate` (if not already set, uses delivered date as fallback)
5. Updates all items:
   - Sets `deliveredQuantity = quantity` (if not already set, capped at ordered quantity)
   - Sets `dispatchedQuantity = quantity` (if not already set)
   - Sets `itemShipmentStatus = 'DELIVERED'` (or 'DISPATCHED' for partial delivery)
6. Triggers PO status update via `updatePOStatusFromPRDelivery()`

## Code Changes

**File:** `lib/db/data-access.ts`
**Function:** `updateOrderStatus()`
**Location:** Lines ~10434-10480

### Key Changes:

1. **Before saving order**, check if status is "Dispatched" or "Delivered"
2. **For "Dispatched"**: Set all shipment-related fields
3. **For "Delivered"**: Set all delivery-related fields AND trigger PO status update
4. **Preserve existing data**: Only set fields if they're not already set (backward compatible)

## Benefits

1. ✅ **GRN Eligibility**: Orders marked as "Delivered" now have all required fields set
2. ✅ **Backward Compatible**: Existing orders with partial data are preserved
3. ✅ **Automatic PO Updates**: PO status automatically updates when orders are delivered
4. ✅ **Complete Tracking**: All shipment/delivery fields are properly set
5. ✅ **No UI Changes Required**: Existing vendor UI continues to work

## Testing

To verify the fix:

1. **Mark an order as "Dispatched"**:
   - Check database: `dispatchStatus` should be `'SHIPPED'`
   - Check items: `dispatchedQuantity` should equal `quantity`
   - Check items: `itemShipmentStatus` should be `'DISPATCHED'`

2. **Mark an order as "Delivered"**:
   - Check database: `deliveryStatus` should be `'DELIVERED'`
   - Check database: `deliveredDate` should be set
   - Check items: `deliveredQuantity` should equal `quantity`
   - Check items: `itemShipmentStatus` should be `'DELIVERED'`
   - Check PO: `po_status` should update to `'COMPLETED'` if all PRs are delivered
   - Check GRN: PO should appear in "Eligible for GRN" list

## Migration Notes

- **Existing orders**: No migration needed - the fix is backward compatible
- **Future orders**: All new status updates will automatically set required fields
- **Manual updates**: If you manually updated orders before this fix, you may need to run:
  ```bash
  node scripts/update-pr-po-statuses.js
  ```

## Related Functions

- `updatePRShipmentStatus()` - Proper shipment API (requires shipment details)
- `updatePRDeliveryStatus()` - Proper delivery API (requires delivery details)
- `updateOrderStatus()` - **Enhanced** simple status update (now sets all fields automatically)
- `updatePOStatusFromPRDelivery()` - Automatically called when order is marked as delivered

## Next Steps

1. Test with a real order marked as "Delivered"
2. Verify GRN eligibility works correctly
3. Monitor server logs for any issues
4. Consider deprecating `updateOrderStatus()` in favor of proper shipment APIs in future

