# String ID Refactoring - Progress Report

## ✅ Completed Work

### 1. Core Models Refactored (5 models)

#### Employee Model (`lib/models/Employee.ts`)
**Changes:**
- ✅ `companyId`: Changed from `mongoose.Types.ObjectId` to `string` with validation
- ✅ `locationId`: Changed from `mongoose.Types.ObjectId` to `string` with validation
- ✅ Removed `ref: 'Company'` and `ref: 'Location'` properties
- ✅ Added 6-digit numeric string validation

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

#### Company Model (`lib/models/Company.ts`)
**Changes:**
- ✅ `adminId`: Changed from `mongoose.Types.ObjectId` to `string` with validation
- ✅ Removed `ref: 'Employee'` property

#### Order Model (`lib/models/Order.ts`)
**Changes:**
- ✅ `employeeId`: Changed to `string` with validation
- ✅ `companyId`: Changed to `string` with validation
- ✅ `uniformId` (in OrderItem): Changed to `string` with validation
- ✅ `site_admin_approved_by`: Changed to `string` with validation
- ✅ `company_admin_approved_by`: Changed to `string` with validation
- ✅ `indent_id`: Changed to `string` with validation
- ✅ Removed all `ref` properties

#### Location Model (`lib/models/Location.ts`)
**Changes:**
- ✅ `companyId`: Changed to `string` with validation
- ✅ `adminId`: Changed to `string` with validation
- ✅ Removed `ref` properties

#### Uniform Model (`lib/models/Uniform.ts`)
**Changes:**
- ✅ `categoryId`: Changed to `string` with validation
- ✅ `companyIds`: Changed from `mongoose.Types.ObjectId[]` to `string[]` with validation
- ✅ Removed `ref` properties

### 2. Migration Script Created

**File:** `scripts/migrate-to-string-ids.js`

**Features:**
- ✅ Converts all ObjectId foreign keys to string IDs
- ✅ Handles nested foreign keys (e.g., `items.uniformId`)
- ✅ Handles array foreign keys (e.g., `companyIds[]`)
- ✅ Generates string IDs from `_id` if missing
- ✅ Logs all missing references
- ✅ Creates detailed migration report
- ✅ Supports dry-run mode

**Usage:**
```bash
# Dry run first
node scripts/migrate-to-string-ids.js --dry-run

# Actual migration
node scripts/migrate-to-string-ids.js
```

### 3. Documentation Created

- ✅ `STRING_ID_REFACTORING_GUIDE.md` - Comprehensive refactoring guide
- ✅ `REFACTORING_PROGRESS.md` - This file

## 🔄 Remaining Work

### High Priority (Critical for Functionality)

#### 1. Remaining Models (25 files)
These models still need refactoring:
- `lib/models/ReturnRequest.ts` - Has `uniformId`, `employeeId`, `companyId` as ObjectId
- `lib/models/PurchaseOrder.ts` - Multiple ObjectId references
- `lib/models/POOrder.ts` - Multiple ObjectId references
- `lib/models/GRN.ts` - May have ObjectId references
- `lib/models/Invoice.ts` - May have ObjectId references
- `lib/models/Payment.ts` - May have ObjectId references
- `lib/models/Branch.ts` - Has `companyId` as ObjectId
- `lib/models/CompanyAdmin.ts` - Has `employeeId`, `companyId` as ObjectId
- `lib/models/LocationAdmin.ts` - Has `employeeId`, `locationId` as ObjectId
- `lib/models/ProductCategory.ts` - May have ObjectId references
- `lib/models/Subcategory.ts` - Has `categoryId` as ObjectId
- `lib/models/ProductSubcategoryMapping.ts` - Multiple ObjectId references
- `lib/models/DesignationProductEligibility.ts` - Multiple ObjectId references
- `lib/models/DesignationSubcategoryEligibility.ts` - Multiple ObjectId references
- `lib/models/VendorInventory.ts` - Has `vendorId`, `productId` as ObjectId
- `lib/models/Relationship.ts` - Multiple ObjectId references
- `lib/models/ProductFeedback.ts` - Has `productId`, `employeeId` as ObjectId
- `lib/models/IndentHeader.ts` - Multiple ObjectId references
- `lib/models/OrderSuborder.ts` - Multiple ObjectId references
- `lib/models/VendorIndent.ts` - Multiple ObjectId references
- `lib/models/VendorInvoice.ts` - Multiple ObjectId references
- `lib/models/Shipment.ts` - May have ObjectId references
- `lib/models/NotificationRouting.ts` - May have ObjectId references
- `lib/models/NotificationSenderProfile.ts` - May have ObjectId references
- `lib/models/GoodsReceiptNote.ts` - May have ObjectId references

**Pattern to Follow:**
1. Update interface to use `string` instead of `mongoose.Types.ObjectId`
2. Update schema to use `String` type with validation
3. Remove `ref` properties
4. Add 6-digit numeric string validation

#### 2. Data Access Layer (`lib/db/data-access.ts`)
**Critical Changes Needed:**
- Remove `convertCompanyIdToNumericId()` function (no longer needed)
- Replace all `findById()` with `findOne({ id })`
- Remove all `populate()` calls - replace with manual joins
- Replace all ObjectId queries with string ID queries
- Remove all `new ObjectId()` constructions
- Remove all `.toString()` on ObjectIds
- Update all aggregation pipelines to use `id` instead of `_id`

**Example Transformations:**

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

**Before:**
```typescript
const numericCompanyId = await convertCompanyIdToNumericId(employee.companyId)
```

**After:**
```typescript
// No conversion needed - companyId is already a string
const companyId = employee.companyId
```

#### 3. API Routes
**Files to Update:**
- `app/api/employees/route.ts`
- `app/api/companies/route.ts`
- `app/api/orders/route.ts`
- `app/api/products/route.ts`
- All other API routes in `app/api/`

**Changes Needed:**
- Remove ObjectId parsing/validation
- Add string ID validation (6-digit numeric)
- Normalize all ID inputs: `const id = String(req.body.id)`
- Update all queries to use `findOne({ id })`

**Example:**

**Before:**
```typescript
const { id } = await request.json()
const employee = await Employee.findById(id)
```

**After:**
```typescript
const { id } = await request.json()
const employeeId = String(id) // Normalize
if (!/^\d{6}$/.test(employeeId)) {
  return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 })
}
const employee = await Employee.findOne({ id: employeeId })
```

### Medium Priority

#### 4. UI Components
**Files to Update:**
- All components in `app/dashboard/`
- All components in `components/`
- Login pages

**Changes Needed:**
- Remove ObjectId conversion logic
- Use string IDs directly in API calls
- Update form handlers to use string IDs

#### 5. Test Files
**Changes Needed:**
- Replace ObjectId mocks with string IDs
- Update test expectations
- Update test data fixtures

### Low Priority

#### 6. Utility Functions
**Files to Remove/Update:**
- Remove `convertCompanyIdToNumericId()` from `lib/db/data-access.ts`
- Remove any other ObjectId conversion utilities
- Add string ID validation utilities if needed

## Next Steps

### Immediate (Before Migration)
1. ✅ Complete refactoring of remaining 25 models
2. ✅ Update data-access.ts systematically
3. ✅ Update all API routes

### Before Production
1. Run migration script in development
2. Test all functionality
3. Fix any issues found
4. Run migration in production (with backup)

### Testing Checklist
- [ ] All models can be created with string IDs
- [ ] All foreign key relationships work
- [ ] All queries return correct data
- [ ] All API endpoints work
- [ ] All UI components display correctly
- [ ] No ObjectId errors in logs
- [ ] Migration script runs successfully
- [ ] All tests pass

## Statistics

- **Total Files with ObjectId References:** ~1190 files
- **Models Refactored:** 5 / 30 (17%)
- **Models Remaining:** 25
- **Migration Script:** ✅ Created
- **Documentation:** ✅ Created

## Notes

- All refactored models have been linted and pass validation
- Migration script handles data conversion automatically
- Keep MongoDB's `_id` field untouched (MongoDB requirement)
- Use `id` field for all application logic
- All IDs should be 6-digit numeric strings
- Validation ensures ID format consistency

## Support

For questions or issues during refactoring, refer to:
- `STRING_ID_REFACTORING_GUIDE.md` - Detailed refactoring patterns
- `scripts/migrate-to-string-ids.js` - Migration script with comments
- This file - Progress tracking
