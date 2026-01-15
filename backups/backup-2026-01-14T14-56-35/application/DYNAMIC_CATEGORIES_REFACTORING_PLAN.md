# Dynamic Product Categories Refactoring Plan

## Overview
This document outlines the refactoring plan to make product categories fully dynamic and data-driven, removing all hard-coded category references.

## Current State
- **Uniform Model**: Uses hard-coded enum `['shirt', 'pant', 'shoe', 'jacket', 'accessory']`
- **DesignationProductEligibility**: Uses hard-coded `itemEligibility` keys (shirt, trouser, pant, shoe, blazer, jacket)
- **Eligibility Logic**: Hard-coded category checks in multiple functions
- **Frontend**: Hard-coded category labels and filters

## Target State
- **ProductCategory Model**: Company-specific categories stored in DB
- **Uniform Model**: References ProductCategory via ObjectId (with backward compatibility)
- **DesignationProductEligibility**: Uses dynamic category references
- **Eligibility Logic**: Fully dynamic, works with any category
- **Frontend**: Fetches categories dynamically from API

## Implementation Steps

### Phase 1: Backend Foundation ✅
1. ✅ Create ProductCategory model
2. ⏳ Create helper functions for category operations
3. ⏳ Update Uniform model (add categoryId, keep category for backward compatibility)
4. ⏳ Create API endpoints for category management

### Phase 2: Core Eligibility Logic
1. ⏳ Refactor `getEmployeeEligibilityFromDesignation` to be dynamic
2. ⏳ Refactor `getConsumedEligibility` to be dynamic
3. ⏳ Refactor `validateEmployeeEligibility` to be dynamic
4. ⏳ Refactor `getProductsForDesignation` to use dynamic categories

### Phase 3: DesignationProductEligibility
1. ⏳ Update model to use dynamic categories
2. ⏳ Update create/update functions
3. ⏳ Update refresh logic

### Phase 4: Frontend
1. ⏳ Create category API endpoints
2. ⏳ Update catalog pages to fetch categories dynamically
3. ⏳ Update eligibility pages to use dynamic categories
4. ⏳ Remove hard-coded category references

### Phase 5: Migration & Testing
1. ⏳ Create migration script for existing data
2. ⏳ Test with existing categories
3. ⏳ Test with new custom categories
4. ⏳ Verify all flows work correctly

## Key Design Decisions

### Backward Compatibility
- Uniform model will support both `category` (string) and `categoryId` (ObjectId)
- During migration, existing string categories will be mapped to ProductCategory records
- Eligibility logic will check both old and new formats

### Category Structure
- Each company has its own categories
- System categories (shirt, pant, shoe, jacket, accessory) are created by default
- Company admins can create custom categories
- Categories have renewal units (months/years) for eligibility calculations

### Eligibility Mapping
- DesignationProductEligibility will store category IDs instead of hard-coded keys
- Eligibility calculations will look up categories dynamically
- Consumption tracking will use category IDs

## Files to Modify

### Backend
- `lib/models/ProductCategory.ts` ✅ (created)
- `lib/models/Uniform.ts` (update)
- `lib/models/DesignationProductEligibility.ts` (update)
- `lib/db/data-access.ts` (major refactoring)
- `app/api/categories/route.ts` (new)
- `app/api/products/route.ts` (update)

### Frontend
- `app/dashboard/company/catalog/page.tsx` (update)
- `app/dashboard/company/designation-eligibility/page.tsx` (update)
- `app/dashboard/consumer/page.tsx` (update)
- `app/dashboard/consumer/catalog/page.tsx` (update)
- `app/dashboard/vendor/catalog/page.tsx` (update)

## Testing Checklist
- [ ] Create new category via Company Admin
- [ ] Assign eligibility for new category
- [ ] Verify employees see correct eligible products
- [ ] Verify orders can be placed with new category
- [ ] Verify inventory updates correctly
- [ ] Verify existing categories still work
- [ ] Verify vendor catalog shows correct categories
- [ ] Verify company admin catalog shows correct categories

