# String ID Refactoring Guide

## Overview

This document tracks the comprehensive refactoring of UDS from MongoDB ObjectId-based references to string-based IDs.

## Status

### ✅ Completed

1. **Core Models Refactored:**
   - ✅ `lib/models/Employee.ts` - companyId, locationId converted to string
   - ✅ `lib/models/Company.ts` - adminId converted to string
   - ✅ `lib/models/Order.ts` - employeeId, companyId, uniformId, site_admin_approved_by, company_admin_approved_by, indent_id converted to string
   - ✅ `lib/models/Location.ts` - companyId, adminId converted to string
   - ✅ `lib/models/Uniform.ts` - categoryId, companyIds converted to string
   - ✅ `lib/models/Vendor.ts` - No ObjectId references (already clean)

2. **Migration Script Created:**
   - ✅ `scripts/migrate-to-string-ids.js` - Automated migration script

### 🔄 In Progress

- Data access layer (`lib/db/data-access.ts`) - Needs systematic refactoring
- API routes - Need to be updated to handle string IDs
- UI components - Need to be updated

### ⏳ Pending

1. **Remaining Models (25 files):**
   - `lib/models/ReturnRequest.ts`
   - `lib/models/PurchaseOrder.ts`
   - `lib/models/POOrder.ts`
   - `lib/models/GRN.ts`
   - `lib/models/Invoice.ts`
   - `lib/models/Payment.ts`
   - `lib/models/Branch.ts`
   - `lib/models/CompanyAdmin.ts`
   - `lib/models/LocationAdmin.ts`
   - `lib/models/ProductCategory.ts`
   - `lib/models/Subcategory.ts`
   - `lib/models/ProductSubcategoryMapping.ts`
   - `lib/models/DesignationProductEligibility.ts`
   - `lib/models/DesignationSubcategoryEligibility.ts`
   - `lib/models/VendorInventory.ts`
   - `lib/models/Relationship.ts`
   - `lib/models/ProductFeedback.ts`
   - `lib/models/IndentHeader.ts`
   - `lib/models/OrderSuborder.ts`
   - `lib/models/VendorIndent.ts`
   - `lib/models/VendorInvoice.ts`
   - `lib/models/Shipment.ts`
   - `lib/models/NotificationRouting.ts`
   - `lib/models/NotificationSenderProfile.ts`
   - `lib/models/GoodsReceiptNote.ts`

2. **Data Access Layer:**
   - `lib/db/data-access.ts` - Massive file, needs systematic refactoring
   - Remove all `convertCompanyIdToNumericId()` calls
   - Remove all `populate()` calls
   - Replace `findById()` with `findOne({ id })`
   - Replace ObjectId queries with string ID queries

3. **API Routes:**
   - All routes in `app/api/` need to be updated
   - Remove ObjectId parsing/validation
   - Add string ID validation
   - Update request handlers

4. **UI Components:**
   - Update all components that use IDs
   - Remove ObjectId conversion logic
   - Update API calls

5. **Test Files:**
   - Update all test mocks
   - Replace ObjectId mocks with string IDs

## Refactoring Pattern

### For Models

**Before:**
```typescript
companyId: {
  type: Schema.Types.ObjectId,
  ref: 'Company',
  required: true,
}
```

**After:**
```typescript
companyId: {
  type: String,
  required: true,
  validate: {
    validator: function(v: string) {
      return /^\d{6}$/.test(v)
    },
    message: 'Company ID must be a 6-digit numeric string (e.g., "100001")'
  }
}
```

### For Queries

**Before:**
```typescript
const employee = await Employee.findById(employeeId)
const company = await Company.findById(employee.companyId)
```

**After:**
```typescript
const employee = await Employee.findOne({ id: employeeId })
const company = await Company.findOne({ id: employee.companyId })
```

### For Populate

**Before:**
```typescript
const employee = await Employee.findById(employeeId)
  .populate('companyId', 'id name')
```

**After:**
```typescript
const employee = await Employee.findOne({ id: employeeId })
if (employee && employee.companyId) {
  const company = await Company.findOne({ id: employee.companyId })
  employee.companyId = company // Manual join
}
```

### For API Routes

**Before:**
```typescript
const { id } = await request.json()
const employee = await Employee.findById(id)
```

**After:**
```typescript
const { id } = await request.json()
const employeeId = String(id) // Normalize to string
const employee = await Employee.findOne({ id: employeeId })
```

## Migration Steps

1. **Update All Models:**
   - Convert all ObjectId foreign keys to string
   - Remove `ref` properties
   - Add validation for 6-digit numeric strings

2. **Run Migration Script:**
   ```bash
   # Dry run first
   node scripts/migrate-to-string-ids.js --dry-run
   
   # Actual migration
   node scripts/migrate-to-string-ids.js
   ```

3. **Update Data Access Layer:**
   - Remove all ObjectId conversion utilities
   - Replace all queries
   - Remove populate() calls

4. **Update API Routes:**
   - Normalize all ID inputs to strings
   - Update all queries

5. **Update UI Components:**
   - Remove ObjectId handling
   - Use string IDs directly

6. **Test Everything:**
   - Test all CRUD operations
   - Test all relationships
   - Test all API endpoints

## Common Issues & Solutions

### Issue: Missing String ID in Document
**Solution:** Migration script will generate IDs from `_id` if missing

### Issue: Invalid Foreign Key Reference
**Solution:** Migration script will log missing references for manual fixing

### Issue: Populate() Not Working
**Solution:** Replace with manual joins using `findOne({ id })`

### Issue: ObjectId Validation Errors
**Solution:** Remove ObjectId validation, add string ID validation

## Files to Update

### High Priority (Core Functionality)
1. `lib/db/data-access.ts` - Main data access layer
2. `app/api/employees/route.ts` - Employee API
3. `app/api/companies/route.ts` - Company API
4. `app/api/orders/route.ts` - Order API
5. `app/api/products/route.ts` - Product API

### Medium Priority (Supporting Features)
- All other API routes
- UI components
- Test files

### Low Priority (Documentation)
- Update documentation
- Update comments

## Testing Checklist

- [ ] All models can be created with string IDs
- [ ] All foreign key relationships work
- [ ] All queries return correct data
- [ ] All API endpoints work
- [ ] All UI components display correctly
- [ ] No ObjectId errors in logs
- [ ] Migration script runs successfully
- [ ] All tests pass

## Notes

- Keep MongoDB's `_id` field untouched (MongoDB requirement)
- Use `id` field for all application logic
- All IDs should be 6-digit numeric strings
- Validation ensures ID format consistency
- Migration script handles data conversion automatically
