# PR Grouping for Company Admin Approvals

## Overview
Pending PRs on the Company Admin approvals page are now grouped by PR Number, making it easier to see which orders belong to the same Purchase Requisition.

## Changes Implemented

### 1. Backend Changes (`lib/db/data-access.ts`)
- **Added PR fields to query**: Updated `getPendingApprovals` to include `pr_number`, `pr_date`, `pr_status`, `site_admin_approved_by`, and `site_admin_approved_at` in the select statement
- **Both parent and child orders**: PR fields are now fetched for both parent orders and child orders (split orders)

### 2. Frontend Changes (`app/dashboard/company/approvals/page.tsx`)

#### PR Grouping Logic
- **Grouping by PR Number**: Orders are grouped by their PR Number
- **Split Order Handling**: For split orders, the PR number is extracted from the first child order (all child orders should have the same PR number)
- **Unassigned PRs**: Orders without a PR number are displayed in a separate "Unassigned PR" section

#### UI Structure
1. **PR Group Header** (Blue background):
   - PR Number (prominent display)
   - PR Date (if available)
   - Order count for the PR
   - Total PR Amount (sum of all orders in the group)
   - "Select All" checkbox for the entire PR group

2. **Order Cards** (within each PR group):
   - Individual order details
   - Checkbox for individual selection
   - Order items, delivery address, total amount
   - Create PO / Approve button

3. **Unassigned PR Section** (Yellow background):
   - Orders without PR numbers
   - Same order card structure as grouped orders

## Features

### PR Group Selection
- **Select All**: Checkbox in PR header selects/deselects all orders in that PR group
- **Indeterminate State**: Checkbox shows indeterminate state when some (but not all) orders in the group are selected
- **Individual Selection**: Orders can still be selected individually within a PR group

### Visual Hierarchy
- **PR Groups**: Blue border and header (blue background)
- **Unassigned PRs**: Yellow border and header (yellow background)
- **Order Cards**: Gray background within PR groups for visual separation

## Business Logic

### PR Number Assignment
- PR Numbers are assigned by Site Admin during approval
- All child orders in a split order should have the same PR number
- Orders without PR numbers are displayed separately

### PO Creation
- Company Admin can select orders from one or multiple PR groups
- PO creation works the same way, but now orders are visually grouped by PR

## Testing Checklist

- ✅ Orders with same PR number are grouped together
- ✅ PR Number and PR Date displayed in group header
- ✅ Total PR Amount calculated correctly
- ✅ "Select All" checkbox works for entire PR group
- ✅ Individual order selection still works
- ✅ Orders without PR number shown in "Unassigned PR" section
- ✅ Split orders grouped correctly by PR number
- ✅ PO creation works with grouped orders

