# Next Steps for String ID Refactoring

## ✅ What's Been Completed

### Models (13/30 - 43%)
- Core models: Employee, Company, Order, Location, Uniform
- Relationship models: ReturnRequest, Branch, CompanyAdmin, LocationAdmin
- Category models: Subcategory, ProductCategory
- Inventory models: VendorInventory, Relationship

### Data Access (6/148 functions - 4%)
- Critical functions updated: getProductById, getLocationById, getCompanyById, getEmployeeByEmail, getEmployeeById
- Helper function: convertCompanyIdToNumericId (deprecated but kept for compatibility)

### Tools & Documentation
- ✅ Migration script created
- ✅ Refactoring guides created
- ✅ Progress tracking documents

## 🎯 Immediate Next Steps

### 1. Complete Remaining Models (17 models)

**Priority Order:**
1. **PurchaseOrder** - Used in order workflow
2. **POOrder** - Used in order workflow
3. **GRN** - Used in goods receipt
4. **Invoice** - Used in billing
5. **Payment** - Used in payments
6. **ProductFeedback** - Used in feedback system
7. **IndentHeader** - Used in indent workflow
8. **OrderSuborder** - Used in order splitting
9. **VendorIndent** - Used in vendor workflow
10. **VendorInvoice** - Used in vendor billing
11. **Shipment** - Used in shipping
12. **DesignationProductEligibility** - Used in eligibility
13. **DesignationSubcategoryEligibility** - Used in eligibility
14. **ProductSubcategoryMapping** - Used in product categorization
15. **NotificationRouting** - Used in notifications
16. **NotificationSenderProfile** - Used in notifications
17. **GoodsReceiptNote** - Used in GRN workflow

**Estimated Time:** 2-3 hours for all models

### 2. Continue Data Access Refactoring

**High Priority Functions to Update:**
1. `getCompanyByAdminEmail()` - Remove ObjectId usage
2. `isCompanyAdmin()` - Remove ObjectId constructions
3. `getProductsByCompany()` - Remove ObjectId fallbacks
4. `getOrdersByEmployee()` - Update queries
5. `getOrdersByCompany()` - Update queries
6. All functions using `findById()` - Replace with `findOne({ id })`
7. All functions using `populate()` - Replace with manual joins

**Pattern to Follow:**
```typescript
// Before
const doc = await Model.findById(id).populate('field').lean()

// After
const doc = await Model.findOne({ id: String(id) }).lean()
if (doc && doc.field) {
  const related = await RelatedModel.findOne({ id: doc.field }).lean()
  if (related) {
    doc.field = toPlainObject(related)
  }
}
```

**Estimated Time:** 8-12 hours for systematic refactoring

### 3. Update API Routes

**Files to Update:**
- `app/api/employees/route.ts`
- `app/api/companies/route.ts`
- `app/api/orders/route.ts`
- `app/api/products/route.ts`
- `app/api/locations/route.ts`
- All other API routes

**Changes Needed:**
```typescript
// Before
const { id } = await request.json()
const item = await Model.findById(id)

// After
const { id } = await request.json()
const itemId = String(id)
if (!/^\d{6}$/.test(itemId)) {
  return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
}
const item = await Model.findOne({ id: itemId })
```

**Estimated Time:** 4-6 hours

## 📋 Systematic Refactoring Approach

### For Each Model File:
1. Read the file
2. Find all `mongoose.Types.ObjectId` in interface
3. Find all `Schema.Types.ObjectId` in schema
4. Replace with String type + validation
5. Remove `ref` properties
6. Update pre-save hooks if they use findById
7. Test with linter

### For Data Access Functions:
1. Find function using `findById` or `populate`
2. Replace `findById` with `findOne({ id })`
3. Replace `populate` with manual joins
4. Remove `convertCompanyIdToNumericId` calls
5. Remove ObjectId constructions
6. Add string ID validation
7. Test with linter

### For API Routes:
1. Find route handler
2. Normalize ID input: `const id = String(req.body.id)`
3. Validate format: `if (!/^\d{6}$/.test(id)) return error`
4. Update query: `findOne({ id })` instead of `findById`
5. Test endpoint

## 🔧 Automation Opportunities

Consider creating helper scripts for:
1. **Bulk Model Refactoring** - Script to refactor all models at once
2. **Find/Replace Patterns** - Script to replace common patterns in data-access.ts
3. **API Route Updater** - Script to update all API routes

## ⚠️ Important Reminders

1. **Never change `_id`** - MongoDB requires it
2. **Always validate** - Use 6-digit numeric string validation
3. **Test incrementally** - Test after each major change
4. **Keep backups** - Database backup before migration
5. **Run migration** - Only after all models are refactored

## 📊 Progress Tracking

Update `REFACTORING_STATUS.md` after each batch of changes.

## 🚀 Quick Wins

These can be done quickly:
1. Remaining 17 models (follow same pattern)
2. Simple API routes (just ID normalization)
3. Remove unused ObjectId conversion utilities

## 💡 Tips

- Use search/replace for common patterns
- Test with linter after each file
- Commit frequently
- Document any edge cases found
