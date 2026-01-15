# Subcategory Implementation Summary

## Architecture Overview

This document summarizes the implementation of company-specific product subcategories with strict parent-child relationships and company-isolated product mappings.

## Domain Models Created

### 1. Category Model (Global - Super Admin Managed)
**File:** `lib/models/Category.ts`
**Collection:** `categories`

**Key Features:**
- Global categories (NO companyId)
- Super Admin creates/manages
- Parent categories for subcategories
- Unique name globally (case-insensitive)

**Fields:**
- `id`: 6-digit unique ID
- `name`: Category name (unique globally)
- `isSystemCategory`: Boolean (system categories cannot be deleted)
- `status`: 'active' | 'inactive'

### 2. Subcategory Model (Company-Specific - Company Admin Managed)
**File:** `lib/models/Subcategory.ts`
**Collection:** `subcategories`

**Key Features:**
- Company-specific subcategories
- Parent-child relationship with Category
- Unique name per company and parent category
- Company Admin creates/manages

**Fields:**
- `id`: 6-digit unique ID
- `name`: Subcategory name
- `parentCategoryId`: ObjectId → Category (REQUIRED)
- `companyId`: ObjectId → Company (REQUIRED)
- `status`: 'active' | 'inactive'

**Constraints:**
- `(parentCategoryId + companyId + name)` is unique (case-insensitive)
- Parent category must exist and be active
- Pre-save validation ensures parent category exists

### 3. ProductSubcategoryMapping Model (Company-Specific)
**File:** `lib/models/ProductSubcategoryMapping.ts`
**Collection:** `productsubcategorymappings`

**Key Features:**
- Maps products to subcategories with company context
- Same product can map to different subcategories for different companies
- Company-specific price override support

**Fields:**
- `productId`: ObjectId → Product (REQUIRED)
- `subCategoryId`: ObjectId → Subcategory (REQUIRED)
- `companyId`: ObjectId → Company (REQUIRED)
- `companySpecificPrice`: Number (optional)

**Constraints:**
- `(productId + subCategoryId + companyId)` is UNIQUE
- Pre-save validation ensures subcategory belongs to the company

### 4. DesignationSubcategoryEligibility Model (Company-Specific)
**File:** `lib/models/DesignationSubcategoryEligibility.ts`
**Collection:** `designationsubcategoryeligibilities`

**Key Features:**
- Eligibility defined at subcategory level (not category level)
- Company-scoped eligibility rules
- Gender-specific eligibility support

**Fields:**
- `id`: 6-digit unique ID
- `designationId`: String (designation name)
- `subCategoryId`: ObjectId → Subcategory (REQUIRED)
- `companyId`: ObjectId → Company (REQUIRED)
- `gender`: 'male' | 'female' | 'unisex' (optional)
- `quantity`: Number (items per cycle)
- `renewalFrequency`: Number
- `renewalUnit`: 'months' | 'years'
- `status`: 'active' | 'inactive'

**Constraints:**
- `(designationId + subCategoryId + companyId + gender)` is UNIQUE
- Pre-save validation ensures subcategory belongs to the company

## API Endpoints Created

### Super Admin APIs

#### Categories (Global)
- `GET /api/super-admin/categories` - List all categories
- `POST /api/super-admin/categories` - Create category
- `PUT /api/super-admin/categories` - Update category
- `DELETE /api/super-admin/categories` - Soft delete category

**File:** `app/api/super-admin/categories/route.ts`

### Company Admin APIs

#### Subcategories (Company-Scoped)
- `GET /api/subcategories?companyId=X&categoryId=Y` - Get subcategories
- `POST /api/subcategories` - Create subcategory
- `PUT /api/subcategories` - Update subcategory
- `DELETE /api/subcategories?subcategoryId=X` - Soft delete subcategory

**File:** `app/api/subcategories/route.ts`

#### Product-Subcategory Mappings (Company-Scoped)
- `GET /api/product-subcategory-mappings?companyId=X&productId=Y&subCategoryId=Z` - Get mappings
- `POST /api/product-subcategory-mappings` - Create mapping
- `DELETE /api/product-subcategory-mappings?mappingId=X` - Delete mapping

**File:** `app/api/product-subcategory-mappings/route.ts`

#### Designation-Subcategory Eligibilities (Company-Scoped)
- `GET /api/designation-subcategory-eligibilities?companyId=X&designationId=Y&subCategoryId=Z` - Get eligibilities
- `POST /api/designation-subcategory-eligibilities` - Create eligibility
- `PUT /api/designation-subcategory-eligibilities` - Update eligibility
- `DELETE /api/designation-subcategory-eligibilities?eligibilityId=X` - Soft delete eligibility

**File:** `app/api/designation-subcategory-eligibilities/route.ts`

## Security & Access Control

### Backend Validation

1. **Company Context Validation:**
   - All Company Admin APIs require `companyId` parameter
   - Subcategory operations validate subcategory belongs to company
   - Product mapping operations validate subcategory belongs to company
   - Eligibility operations validate subcategory belongs to company

2. **Parent-Child Validation:**
   - Subcategory creation validates parent category exists and is active
   - Subcategory cannot be created without valid parent category

3. **Unique Constraints:**
   - Database-level unique indexes prevent duplicates
   - Application-level validation provides user-friendly error messages

### TODO: Enhanced Authentication

The current implementation uses `companyId` from request parameters. For production, implement:
- JWT token-based authentication
- Extract companyId from token claims
- Validate user is Company Admin for the specified company
- Reject requests with mismatched companyId

**Helper File:** `lib/utils/api-auth.ts` (placeholder for future auth implementation)

## Data Migration Strategy

### Phase 1: Category Migration
1. Migrate existing `productcategories` to global `categories`
2. Remove `companyId` from categories
3. Create system categories if they don't exist

### Phase 2: Subcategory Creation
1. For each company, create default subcategories under each category
2. Map existing category names to subcategories

### Phase 3: Product Mapping Migration
1. Migrate existing product-category associations to product-subcategory mappings
2. Create mappings for each company that uses the product

### Phase 4: Eligibility Migration
1. Migrate designation eligibilities from category level to subcategory level
2. Map category-based eligibilities to subcategory-based eligibilities

## UI Flow Requirements

### Super Admin Portal

**Category Management Page:**
- List all categories (global)
- Create new category
- Edit category name
- Activate/deactivate category
- Cannot delete system categories
- Cannot delete categories with active subcategories

### Company Admin Portal

**Subcategory Management Page:**
- List subcategories for logged-in company
- Group by parent category (read-only category display)
- Create subcategory under a category
- Edit subcategory name
- Activate/deactivate subcategory
- Cannot delete subcategories with active mappings or eligibilities

**Product Edit Page (Catalogue):**
- Show product details (read-only: name, description, category)
- Show company-specific subcategory assignments
- Allow assigning product to multiple subcategories
- Allow setting company-specific price per subcategory
- Only show subcategories for logged-in company

**Designation Eligibility Page:**
- Show subcategories grouped under parent categories
- Define eligibility at subcategory level
- Only show subcategories for logged-in company
- Support gender-specific eligibility

## Validation Checklist

### Multi-Company Product Reuse
- [x] Same product can map to different subcategories for different companies
- [x] Product mappings are isolated per company (unique constraint)
- [x] Queries filter by companyId to prevent cross-company leakage

### Eligibility Correctness
- [x] Eligibility defined at subcategory level
- [x] Eligibility is company-scoped
- [x] Unique constraint prevents duplicate eligibilities

### Access Control Enforcement
- [x] Backend validates subcategory belongs to company
- [x] Unique constraints prevent cross-company data
- [ ] TODO: Extract companyId from auth context (not just request params)
- [ ] TODO: Validate user is Company Admin for the company

### Data Integrity
- [x] Parent-child relationships enforced (pre-save validation)
- [x] Unique constraints prevent duplicates
- [x] Foreign key relationships maintained
- [x] Soft deletes preserve referential integrity

## Next Steps

1. **Create Migration Script:**
   - Migrate existing categories to global categories
   - Create default subcategories for each company
   - Migrate product-category associations to mappings
   - Migrate designation eligibilities to subcategory level

2. **Update Product Edit UI:**
   - Add subcategory selection (company-scoped)
   - Add company-specific price override
   - Enforce read-only fields (name, description, category)

3. **Update Designation Eligibility UI:**
   - Change from category level to subcategory level
   - Group subcategories under parent categories
   - Filter by company

4. **Enhance Authentication:**
   - Implement JWT token-based auth
   - Extract companyId from token claims
   - Validate Company Admin access

5. **Update Eligibility Logic:**
   - Refactor eligibility calculations to use subcategory mappings
   - Update consumed eligibility tracking
   - Update product filtering logic

## Files Created

### Models
- `lib/models/Category.ts` - Global categories
- `lib/models/Subcategory.ts` - Company-specific subcategories
- `lib/models/ProductSubcategoryMapping.ts` - Product-subcategory mappings
- `lib/models/DesignationSubcategoryEligibility.ts` - Subcategory-level eligibility

### APIs
- `app/api/super-admin/categories/route.ts` - Super Admin category management
- `app/api/subcategories/route.ts` - Company Admin subcategory management
- `app/api/product-subcategory-mappings/route.ts` - Product-subcategory mapping management
- `app/api/designation-subcategory-eligibilities/route.ts` - Eligibility management

### Utilities
- `lib/utils/api-auth.ts` - API authentication helpers (placeholder)

### Documentation
- `SUBCATEGORY_ARCHITECTURE_DESIGN.md` - Complete architecture design
- `SUBCATEGORY_IMPLEMENTATION_SUMMARY.md` - This file

## Important Notes

1. **Backward Compatibility:**
   - Existing `ProductCategory` model remains (for migration)
   - Existing `DesignationProductEligibility` model remains (for migration)
   - New models are separate collections

2. **Migration Required:**
   - Existing data needs to be migrated to new structure
   - Migration script should be created and tested before production deployment

3. **Authentication:**
   - Current implementation uses request parameters for companyId
   - Production implementation should use JWT tokens or session-based auth
   - CompanyId should be extracted from authenticated user context

4. **Product Edit Permissions:**
   - Company Admin cannot edit: name, description, categoryId
   - Company Admin can edit: company-specific price, subcategory mappings
   - Enforcement should be at both UI and API levels

