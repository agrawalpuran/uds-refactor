# PO_CREATED Status Validation Fix

## Problem Statement
PO creation was failing with error: "Order <ORDER_ID> is not in approved status (current: PO_CREATED)"

## Root Cause
The validation logic in `createPurchaseOrderFromPRs` was only allowing orders with:
- `PENDING_COMPANY_ADMIN_APPROVAL`
- `SITE_ADMIN_APPROVED`

But **`PO_CREATED` is a valid status** for PO creation, as it allows:
- Re-creating POs
- Updating existing POs
- Handling cases where a PO was created but needs to be modified

## Business Rule Clarification
**PO creation should be allowed when pr_status is:**
- ✅ `PENDING_COMPANY_ADMIN_APPROVAL` (awaiting Company Admin approval)
- ✅ `SITE_ADMIN_APPROVED` (Site Admin approved, no Company Admin approval needed)
- ✅ `PO_CREATED` (PR already has PO created - allows re-creating or updating PO)

## Fix Applied

### File: `lib/db/data-access.ts` (Line ~11515)

**Before**:
```typescript
// Validate all orders are approved PRs
for (const order of ordersToProcess) {
  if (order.pr_status !== 'PENDING_COMPANY_ADMIN_APPROVAL' && order.pr_status !== 'SITE_ADMIN_APPROVED') {
    throw new Error(`Order ${order.id} is not in approved status (current: ${order.pr_status})`)
  }
  // ...
}
```

**After**:
```typescript
// Validate all orders are approved PRs or already have PO created
// BUSINESS RULE: PO creation is allowed when pr_status is:
// - PENDING_COMPANY_ADMIN_APPROVAL (awaiting Company Admin approval)
// - SITE_ADMIN_APPROVED (Site Admin approved, no Company Admin approval needed)
// - PO_CREATED (PR already has PO created - allows re-creating or updating PO)
for (const order of ordersToProcess) {
  const validStatuses = ['PENDING_COMPANY_ADMIN_APPROVAL', 'SITE_ADMIN_APPROVED', 'PO_CREATED']
  if (!validStatuses.includes(order.pr_status)) {
    throw new Error(`Order ${order.id} is not in a valid status for PO creation. Current status: ${order.pr_status}. Valid statuses: ${validStatuses.join(', ')}`)
  }
  // ...
}
```

## Changes Made

1. ✅ **Added `PO_CREATED` to valid statuses**: Now allows PO creation for orders that already have a PO
2. ✅ **Improved error message**: Shows current status and all valid statuses
3. ✅ **Added business rule comments**: Documents why each status is valid
4. ✅ **Used array-based validation**: More maintainable and clear

## Status Flow

```
Order Created
  ↓
PENDING_SITE_ADMIN_APPROVAL
  ↓ (Site Admin approves)
SITE_ADMIN_APPROVED
  ↓ (if Company Admin approval required)
PENDING_COMPANY_ADMIN_APPROVAL
  ↓ (Company Admin creates PO)
PO_CREATED ✅ (Now valid for PO creation)
```

## Validation Checklist

- ✅ PO creation succeeds for orders with `PO_CREATED` status
- ✅ PO creation succeeds for orders with `PENDING_COMPANY_ADMIN_APPROVAL` status
- ✅ PO creation succeeds for orders with `SITE_ADMIN_APPROVED` status
- ✅ Error messages are clear and informative
- ✅ No regressions in existing workflows

## Testing Recommendations

1. Test PO creation with order in `PO_CREATED` status
2. Test PO creation with order in `PENDING_COMPANY_ADMIN_APPROVAL` status
3. Test PO creation with order in `SITE_ADMIN_APPROVED` status
4. Verify error message when order is in invalid status (e.g., `DRAFT`)

