# GRN Eligibility Debug Guide

## Root Cause Analysis

The GRN page shows "No POs eligible for GRN creation" even when orders are marked as "Delivered". This document explains how to diagnose and fix the issue.

## Diagnostic Steps

### 1. Check Server Logs

When you access the GRN page, check the server console for these log messages:

```
[getPOsEligibleForGRN] Processing X PO(s) for vendor Y
[getPOsEligibleForGRN] Checking PO <PO_NUMBER> (PO ID: <PO_ID>)
[derivePOShippingStatus] Analyzing X PR(s) for PO <PO_ID>
[derivePOShippingStatus] PR <PR_ID>: deliveryStatus=..., status=..., items=X
[derivePOShippingStatus] Summary: totalItems=X, itemsShipped=X, itemsDelivered=X
[derivePOShippingStatus] ✅ PO <PO_ID> is FULLY_DELIVERED
[getPOsEligibleForGRN] ✅ PO <PO_NUMBER> is FULLY_DELIVERED, adding to eligible list
```

### 2. Common Issues and Solutions

#### Issue A: Orders Not Linked to PO
**Symptom:** `[derivePOShippingStatus] Analyzing 0 PR(s) for PO <PO_ID>`

**Root Cause:** Orders are not linked to the PO via `POOrder` mapping table.

**Solution:**
- Check if `POOrder` records exist for the PO
- Verify orders were created when PO was created
- Check if orders have `pr_status = 'PO_CREATED'`

#### Issue B: Order Status Not Set Correctly
**Symptom:** `[derivePOShippingStatus] PR <PR_ID> item NOT delivered (ordered: X, delivered: 0, orderStatus: ..., deliveryStatus: ...)`

**Root Cause:** Orders are marked as "Delivered" but:
- `deliveryStatus` is not set to `'DELIVERED'`
- `status` is not set to `'Delivered'`
- Item-level `deliveredQuantity` is not set

**Solution:**
- Check order status in database
- Verify `updateOrderStatus()` or `updatePRDeliveryStatus()` was called correctly
- Run the status update script: `node scripts/update-pr-po-statuses.js`

#### Issue C: Item-Level Quantities Not Set
**Symptom:** `deliveredQuantity` is 0 even though order is marked as delivered

**Root Cause:** Orders were marked as delivered via old `updateOrderStatus()` which doesn't set item-level quantities.

**Solution:**
- The code now handles this by checking order-level `status` and `deliveryStatus`
- If still not working, ensure these fields are set:
  ```javascript
  {
    status: 'Delivered',
    deliveryStatus: 'DELIVERED'
  }
  ```

#### Issue D: PO Not Found for Vendor
**Symptom:** `[getPOsEligibleForGRN] Processing 0 PO(s) for vendor <VENDOR_ID>`

**Root Cause:** No POs exist for this vendor, or `vendorId` mismatch.

**Solution:**
- Verify vendor ID is correct (6-digit numeric string)
- Check if POs exist in database with matching `vendorId`
- Verify `vendorId` in PO matches the logged-in vendor

### 3. Database Queries to Check

Run these queries in MongoDB to diagnose:

```javascript
// 1. Check if orders exist and their status
db.orders.find({
  id: { $in: ["ORD-1767283150715-K27L2PZ8O-100001", "ORD-1767264184429-R1CY18RIY-100001"] }
}).pretty()

// 2. Check if orders are linked to PO
db.poorders.find({
  order_id: { $in: [/* ObjectIds from step 1 */] }
}).pretty()

// 3. Check PO details
db.purchaseorders.find({
  vendorId: "100001" // Replace with actual vendor ID
}).pretty()

// 4. Check if GRN already exists
db.grns.find({
  vendorId: "100001" // Replace with actual vendor ID
}).pretty()
```

### 4. Expected Data Structure

For an order to be eligible for GRN, it must have:

```javascript
{
  id: "ORD-...",
  status: "Delivered",  // OR
  deliveryStatus: "DELIVERED",  // OR
  items: [
    {
      quantity: 5,
      deliveredQuantity: 5  // Must be >= quantity
    }
  ]
}
```

### 5. Fix Commands

If orders are marked as "Delivered" but not showing in GRN:

```bash
# Run the status update script to retroactively update PR and PO statuses
node scripts/update-pr-po-statuses.js

# Or for a specific company
node scripts/update-pr-po-statuses.js <COMPANY_ID>
```

## Next Steps

1. **Check server logs** when accessing GRN page
2. **Identify which issue** (A, B, C, or D) applies
3. **Apply the solution** for that issue
4. **Refresh GRN page** and verify POs appear

## Debug Output Example

When working correctly, you should see:

```
[getPOsEligibleForGRN] Processing 2 PO(s) for vendor 100001
[getPOsEligibleForGRN] Checking PO PO-12345 (PO ID: 123456)
[derivePOShippingStatus] Analyzing 2 PR(s) for PO 123456
[derivePOShippingStatus] PR ORD-1767283150715-K27L2PZ8O-100001: deliveryStatus=DELIVERED, status=Delivered, items=3
[derivePOShippingStatus] PR ORD-1767283150715-K27L2PZ8O-100001 item marked as delivered (order-level status)
[derivePOShippingStatus] Summary: totalItems=3, itemsShipped=3, itemsDelivered=3
[derivePOShippingStatus] ✅ PO 123456 is FULLY_DELIVERED
[getPOsEligibleForGRN] ✅ PO PO-12345 is FULLY_DELIVERED, adding to eligible list
[getPOsEligibleForGRN] ✅ Found 1 eligible PO(s) for GRN creation
```

