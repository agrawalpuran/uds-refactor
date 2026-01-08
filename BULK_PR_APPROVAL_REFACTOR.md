# Bulk PR Approval UX Refactor

## Problem Statement
When multiple orders were selected for bulk approval, the UI showed individual PR Number and PR Date inputs for each order, requiring users to enter the same information multiple times. This was incorrect UX and business behavior.

## Solution Implemented

### 1. Modal Layout Change ✅

**Before**: Each order card had its own PR Number and PR Date inputs

**After**: 
- **Single Common Input Section** at the top of the modal (when multiple orders selected):
  - One PR Number input
  - One PR Date input
  - Clear label: "These PR details will be applied to all X selected orders"
- **Read-Only Order List** below:
  - Shows Order ID, Employee name, Item count, Amount
  - No PR inputs on individual cards
  - Displays order status badge

### 2. Single-Order Behavior ✅
- **Unchanged**: When only one order is selected, the existing single-order modal behavior is preserved

### 3. Backend Handling ✅
- **Validation**: PR Number and PR Date validated once
- **Application**: Same PR Number and PR Date applied to:
  - All selected parent orders
  - All corresponding child/vendor orders
- **Data Integrity**: All orders in a bulk approval get identical PR data

### 4. Data Integrity Rules ✅
- **All-or-Nothing**: If any order fails PR assignment, entire bulk approval is aborted
- **Consistent PR Data**: PR Number and PR Date are identical across all orders
- **Error Handling**: Clear error messages if validation fails

### 5. UX & Messaging ✅
- Clear indication that PR details apply to all orders
- Success message includes PR Number
- Read-only order list shows all selected orders
- Disabled state on approve button until PR data is entered

## Code Changes

### File: `app/dashboard/consumer/approvals/page.tsx`

#### State Management
- Added `bulkPRNumber` and `bulkPRDate` state for common PR data
- Removed dependency on per-order `bulkPRData` Map for bulk approval

#### Modal UI (Line ~604)
- Added single PR input section at top (blue background, clear labeling)
- Converted order cards to read-only display
- Removed individual PR inputs from order cards

#### Approval Logic (Line ~179)
- Simplified validation: Check `bulkPRNumber` and `bulkPRDate` once
- Apply same PR data to all orders (parent and child)
- Include both parent and child order IDs in PR data map for split orders

## Testing Checklist

- ✅ Single order approval: Works as before
- ✅ Multiple order approval: Single PR input applies to all
- ✅ Split orders: Parent and child orders get same PR data
- ✅ Validation: Fails fast if PR data missing
- ✅ Error handling: Clear error messages
- ✅ Success message: Shows PR Number used

## User Experience Improvements

1. **Reduced Data Entry**: Enter PR details once instead of N times
2. **Clear Intent**: Visual indication that PR applies to all orders
3. **Better UX**: Read-only order list shows what will be approved
4. **Data Consistency**: Guaranteed identical PR data across all orders

