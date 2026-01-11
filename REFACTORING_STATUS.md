# String ID Refactoring - Current Status

## ✅ Completed (13 Models)

1. ✅ Employee - companyId, locationId
2. ✅ Company - adminId
3. ✅ Order - employeeId, companyId, uniformId, approval fields, indent_id
4. ✅ Location - companyId, adminId
5. ✅ Uniform - categoryId, companyIds
6. ✅ ReturnRequest - uniformId, employeeId, companyId
7. ✅ Branch - companyId, adminId
8. ✅ CompanyAdmin - companyId, employeeId
9. ✅ LocationAdmin - locationId
10. ✅ Subcategory - parentCategoryId, companyId
11. ✅ ProductCategory - companyId
12. ✅ VendorInventory - vendorId, productId
13. ✅ Relationship - All ProductCompany, ProductVendor, VendorCompany fields

## 🔄 In Progress

### Data Access Layer (`lib/db/data-access.ts`)
- ✅ Updated `convertCompanyIdToNumericId()` - Now just validates strings (deprecated, kept for compatibility)
- ✅ Updated `getProductById()` - Uses findOne({ id }), removed ObjectId fallback
- ✅ Updated `getLocationById()` - Manual joins instead of populate
- ✅ Updated `getCompanyById()` - Manual joins instead of populate
- ✅ Updated `getEmployeeByEmail()` - Removed all ObjectId conversions, uses manual joins
- ✅ Updated `getEmployeeById()` - Manual joins instead of populate
- ⏳ Remaining: ~670+ ObjectId patterns to refactor

### Remaining Models (17 models)
- PurchaseOrder
- POOrder
- GRN
- Invoice
- Payment
- ProductFeedback
- IndentHeader
- OrderSuborder
- VendorIndent
- VendorInvoice
- Shipment
- NotificationRouting
- NotificationSenderProfile
- GoodsReceiptNote
- DesignationProductEligibility
- DesignationSubcategoryEligibility
- ProductSubcategoryMapping

## 📊 Statistics

- **Models Refactored:** 13 / 30 (43%)
- **Models Remaining:** 17
- **Data Access Functions Updated:** 4 / 148 (3%)
- **ObjectId Patterns Remaining in data-access.ts:** ~680
- **Migration Script:** ✅ Created and ready

## 🎯 Next Steps

### Immediate (Continue Model Refactoring)
1. Refactor remaining 17 models (follow same pattern)
2. Each model takes ~5-10 minutes

### High Priority (Data Access Layer)
1. Systematically replace all `findById()` with `findOne({ id })`
2. Replace all `populate()` with manual joins
3. Remove all `convertCompanyIdToNumericId()` calls (replace with direct use)
4. Remove all `new mongoose.Types.ObjectId()` constructions
5. Update all aggregation pipelines

### Medium Priority (API Routes)
1. Update all API routes to normalize string IDs
2. Add validation for 6-digit numeric format
3. Remove ObjectId parsing

### Low Priority (UI & Tests)
1. Update UI components
2. Update test files

## 📝 Refactoring Pattern (For Remaining Models)

For each model file:

1. **Update Interface:**
   ```typescript
   // Before
   companyId: mongoose.Types.ObjectId
   
   // After
   companyId: string // String ID reference to Company (6-digit numeric string)
   ```

2. **Update Schema:**
   ```typescript
   // Before
   companyId: {
     type: Schema.Types.ObjectId,
     ref: 'Company',
     required: true,
   }
   
   // After
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

3. **Update Pre-save Hooks:**
   - Replace `findById()` with `findOne({ id })`
   - Remove populate() calls

## 🔧 Tools Created

1. ✅ `scripts/migrate-to-string-ids.js` - Database migration script
2. ✅ `scripts/refactor-data-access-patterns.md` - Refactoring patterns guide
3. ✅ `STRING_ID_REFACTORING_GUIDE.md` - Comprehensive guide
4. ✅ `REFACTORING_PROGRESS.md` - Progress tracking

## ⚠️ Important Notes

- All refactored models pass linting
- Migration script ready but should be run AFTER all models are refactored
- Data-access.ts is massive (21,000+ lines) - will require systematic refactoring
- Keep MongoDB's `_id` field untouched (MongoDB requirement)
- Use `id` field for all application logic

## 🚀 Quick Commands

```bash
# Check remaining ObjectId usage in models
grep -r "Schema.Types.ObjectId" lib/models/ | wc -l

# Check ObjectId usage in data-access
grep -c "ObjectId\|findById\|populate" lib/db/data-access.ts

# Run migration (after all models refactored)
node scripts/migrate-to-string-ids.js --dry-run
```
