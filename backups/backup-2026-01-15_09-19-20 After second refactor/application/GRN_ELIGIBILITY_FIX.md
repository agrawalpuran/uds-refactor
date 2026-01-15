# GRN Eligibility Fix & Vendor Order Display Enhancement

## Issues Fixed

### Issue 1: GRN Not Being Created for Delivered Orders

**Problem:**
Orders `ORD-1767283150715-K27L2PZ8O-100001` and `ORD-1767264184429-R1CY18RIY-100001` were marked as "Delivered" but GRN was not being created/updated.

**Root Cause:**
The `derivePOShippingStatus()` function was checking item-level `deliveredQuantity` to determine if a PO is `FULLY_DELIVERED`. However, when orders are marked as "Delivered" via the old `updateOrderStatus()` function (instead of the new shipment API), the item-level `deliveredQuantity` fields are not set, causing the GRN eligibility check to fail.

**Solution:**
Updated `derivePOShippingStatus()` in `lib/db/data-access.ts` to:
1. Check both item-level `deliveredQuantity` AND order-level `deliveryStatus` field
2. If an order has `deliveryStatus = 'DELIVERED'` or `status = 'Delivered'`, consider all items as delivered even if item-level quantities aren't set
3. This ensures backward compatibility with orders marked as delivered via the old workflow

**Code Changes:**
- Modified `derivePOShippingStatus()` function (lines ~12052-12077)
- Added fallback logic to check `pr.deliveryStatus` and `pr.status` when item-level `deliveredQuantity` is not set

### Issue 2: Vendor Orders Not Displaying PO and PR Numbers

**Problem:**
Vendors viewing their orders could not see the PO Number and PR Number associated with each order.

**Root Cause:**
The `getOrdersByVendor()` function was not fetching PO numbers via the `POOrder` mapping table, and PR numbers were not being explicitly selected.

**Solution:**
1. Updated `getOrdersByVendor()` in `lib/db/data-access.ts` to:
   - Explicitly select PR fields (`pr_number`, `pr_date`) in the query
   - Fetch PO details via `POOrder` mapping table
   - Add `poNumbers` array and `poDetails` array to each order
   - Add `prNumber` and `prDate` fields to each order

2. Updated vendor orders page UI (`app/dashboard/vendor/orders/page.tsx`) to:
   - Display PR Number (if available) in blue text
   - Display PO Number(s) (if available) in green text
   - Show these fields below the order date

**Code Changes:**
- Modified `getOrdersByVendor()` function (lines ~6921-6979)
- Added PO/PR number fetching logic using `POOrder` mappings
- Updated vendor orders page UI to display PO and PR numbers

## Testing

To verify the fixes:

1. **GRN Eligibility:**
   - Check orders that are marked as "Delivered"
   - Verify that `derivePOShippingStatus()` returns `FULLY_DELIVERED` for POs containing these orders
   - Verify that these POs appear in the "Eligible for GRN" list for vendors

2. **Vendor Order Display:**
   - Login as a vendor
   - Navigate to Orders page
   - Verify that PR Number and PO Number(s) are displayed for each order
   - Verify that orders without PR/PO numbers still display correctly (no errors)

## Files Modified

1. `lib/db/data-access.ts`
   - `derivePOShippingStatus()` - Added fallback logic for delivered orders
   - `getOrdersByVendor()` - Added PO and PR number fetching

2. `app/dashboard/vendor/orders/page.tsx`
   - Added UI elements to display PR and PO numbers

## Backward Compatibility

- ✅ Orders marked as "Delivered" via old `updateOrderStatus()` function are now recognized for GRN eligibility
- ✅ Orders without PO/PR numbers still display correctly (no errors)
- ✅ Existing GRN creation logic remains unchanged

## Next Steps

1. Test with the specific orders mentioned: `ORD-1767283150715-K27L2PZ8O-100001` and `ORD-1767264184429-R1CY18RIY-100001`
2. Verify GRN eligibility for these orders' POs
3. Verify vendor can see PO and PR numbers in the orders list

