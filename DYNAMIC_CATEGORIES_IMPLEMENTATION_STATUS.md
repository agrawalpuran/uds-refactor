# Dynamic Categories Implementation Status

## ✅ Completed

### 1. ProductCategory Model
- ✅ Created `lib/models/ProductCategory.ts`
- ✅ Supports company-specific categories
- ✅ Includes renewal unit (months/years)
- ✅ Supports system categories and custom categories

### 2. Category Helper Functions
- ✅ Created `lib/db/category-helpers.ts`
- ✅ `getCategoriesByCompany()` - Get all categories for a company
- ✅ `getCategoryByIdOrName()` - Get category by ID or name (backward compatible)
- ✅ `normalizeCategoryName()` - Normalize legacy category names
- ✅ `getProductCategoryId()` - Get category ID from product (handles both formats)
- ✅ `getProductCategoryName()` - Get category name from product (handles both formats)
- ✅ `ensureSystemCategories()` - Create default system categories

### 3. Category API Endpoints
- ✅ Created `app/api/categories/route.ts`
- ✅ GET - Fetch all categories for a company
- ✅ POST - Create new category
- ✅ PUT - Update category
- ✅ DELETE - Soft delete category (set status to inactive)

### 4. Uniform Model Updates
- ✅ Added `categoryId` field (ObjectId reference to ProductCategory)
- ✅ Made `category` field optional (for backward compatibility)
- ✅ Added index on `categoryId`
- ✅ Supports both old (string) and new (ObjectId) formats

## ⏳ In Progress / Remaining

### Critical Backend Functions to Refactor

#### 1. Eligibility Functions (HIGH PRIORITY)
- ⏳ `getEmployeeEligibilityFromDesignation()` - Currently returns hard-coded `{ shirt, pant, shoe, jacket }`
  - **Action**: Refactor to return dynamic category-based eligibility
  - **Location**: `lib/db/data-access.ts:5864`
  
- ⏳ `getConsumedEligibility()` - Currently checks hard-coded categories
  - **Action**: Refactor to work with any category
  - **Location**: `lib/db/data-access.ts:5953`
  
- ⏳ `validateEmployeeEligibility()` - Currently validates hard-coded categories
  - **Action**: Refactor to validate any category dynamically
  - **Location**: `lib/db/data-access.ts:6052`

#### 2. Product Filtering Functions
- ⏳ `getProductsForDesignation()` - Uses hard-coded category normalization
  - **Action**: Use dynamic category lookup instead
  - **Location**: `lib/db/data-access.ts:10887`

#### 3. DesignationProductEligibility Model
- ⏳ Update model to use dynamic categories instead of hard-coded keys
  - **Action**: Change `itemEligibility` from fixed keys to dynamic category references
  - **Location**: `lib/models/DesignationProductEligibility.ts:48`

#### 4. Frontend Components
- ⏳ `app/dashboard/company/catalog/page.tsx` - Remove hard-coded category filters
- ⏳ `app/dashboard/company/designation-eligibility/page.tsx` - Use dynamic categories
- ⏳ `app/dashboard/consumer/page.tsx` - Remove hard-coded category checks
- ⏳ `app/dashboard/consumer/catalog/page.tsx` - Fetch categories dynamically
- ⏳ `app/dashboard/vendor/catalog/page.tsx` - Use dynamic categories

## Implementation Pattern

### For Eligibility Functions:
1. Fetch categories for the company
2. Build eligibility map dynamically from categories
3. Use category IDs instead of hard-coded strings
4. Maintain backward compatibility with legacy data

### Example Pattern:
```typescript
// OLD (hard-coded):
const eligibility = {
  shirt: itemElig.shirt?.quantity || 0,
  pant: itemElig.pant?.quantity || 0,
  // ...
}

// NEW (dynamic):
const categories = await getCategoriesByCompany(companyId)
const eligibility: Record<string, number> = {}
for (const category of categories) {
  const categoryKey = category.name.toLowerCase()
  eligibility[categoryKey] = itemElig[categoryKey]?.quantity || 0
}
```

## Migration Strategy

### Phase 1: Backward Compatibility (Current)
- Uniform model supports both `category` (string) and `categoryId` (ObjectId)
- Helper functions handle both formats
- Existing data continues to work

### Phase 2: Migration Script (Next)
- Create script to:
  1. Ensure system categories exist for all companies
  2. Map existing products to category IDs
  3. Update DesignationProductEligibility records

### Phase 3: Full Dynamic (Future)
- Remove hard-coded category checks
- All logic uses dynamic categories
- Frontend fully dynamic

## Testing Checklist

- [ ] Create new category via API
- [ ] Assign eligibility for new category
- [ ] Verify employees see correct eligible products
- [ ] Verify orders can be placed with new category
- [ ] Verify inventory updates correctly
- [ ] Verify existing categories still work
- [ ] Verify backward compatibility with legacy data

## Next Steps

1. **Refactor Core Eligibility Functions** (Priority 1)
   - Start with `getEmployeeEligibilityFromDesignation()`
   - Then `getConsumedEligibility()`
   - Then `validateEmployeeEligibility()`

2. **Update DesignationProductEligibility Model** (Priority 2)
   - Change structure to support dynamic categories
   - Update create/update functions

3. **Frontend Updates** (Priority 3)
   - Add category fetching to all relevant pages
   - Remove hard-coded category references
   - Update UI to show dynamic categories

4. **Migration Script** (Priority 4)
   - Create script to migrate existing data
   - Test migration on sample data

## Notes

- All changes maintain backward compatibility
- Legacy data (string categories) continues to work
- New data uses dynamic categories
- Migration can be done gradually

