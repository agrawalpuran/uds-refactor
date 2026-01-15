# Subcategory Architecture Design - UDS

## Executive Summary

This document defines the architecture for implementing company-specific product subcategories with strict parent-child relationships and company-isolated product mappings.

## Current State Analysis

### Existing Models
1. **Product (Uniform)**: Global products with `categoryId` → ProductCategory
2. **ProductCategory**: Company-specific categories (WRONG - needs to be global)
3. **DesignationProductEligibility**: Uses category names in `itemEligibility`
4. **No Subcategory Model**: Does not exist

### Issues Identified
- Categories are company-specific (should be global)
- No subcategory concept exists
- Product-category association is not company-aware
- Eligibility is at category level (needs subcategory level)

## Target Architecture

### Domain Model Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ CATEGORY (Global - Super Admin Managed)                 │
│ - id: string (6-digit, e.g., "500001")                 │
│ - name: string (e.g., "Shirt", "Pant")                  │
│ - isSystemCategory: boolean                             │
│ - status: 'active' | 'inactive'                         │
│ - NO companyId (GLOBAL)                                 │
└─────────────────────────────────────────────────────────┘
                        │
                        │ parent-child
                        ▼
┌─────────────────────────────────────────────────────────┐
│ SUBCATEGORY (Company-Specific - Company Admin Managed)  │
│ - id: string (6-digit, e.g., "600001")                  │
│ - name: string (e.g., "Managers Full Shirt")            │
│ - parentCategoryId: ObjectId → Category                 │
│ - companyId: ObjectId → Company (REQUIRED)              │
│ - status: 'active' | 'inactive'                         │
│ - UNIQUE: (parentCategoryId + companyId + name)         │
└─────────────────────────────────────────────────────────┘
                        │
                        │ many-to-many (company-scoped)
                        ▼
┌─────────────────────────────────────────────────────────┐
│ PRODUCT_SUBCATEGORY_MAPPING (Company-Specific)           │
│ - productId: ObjectId → Product                         │
│ - subCategoryId: ObjectId → Subcategory                 │
│ - companyId: ObjectId → Company (REQUIRED)               │
│ - companySpecificPrice?: number (optional override)     │
│ - UNIQUE: (productId + subCategoryId + companyId)       │
└─────────────────────────────────────────────────────────┘
                        │
                        │ eligibility
                        ▼
┌─────────────────────────────────────────────────────────┐
│ DESIGNATION_SUBCATEGORY_ELIGIBILITY (Company-Specific)  │
│ - designationId: string                                 │
│ - subCategoryId: ObjectId → Subcategory                 │
│ - companyId: ObjectId → Company (REQUIRED)              │
│ - quantity: number                                      │
│ - renewalFrequency: number                              │
│ - renewalUnit: 'months' | 'years'                       │
│ - UNIQUE: (designationId + subCategoryId + companyId)   │
└─────────────────────────────────────────────────────────┘
```

## Data Model Specifications

### 1. Category Model (GLOBAL - Modified)

**Collection:** `categories` (renamed from `productcategories`)

```typescript
interface ICategory {
  id: string                    // 6-digit unique ID (e.g., "500001")
  name: string                  // "Shirt", "Pant", "Shoe", etc.
  isSystemCategory: boolean     // true for system categories
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
  // NO companyId - GLOBAL
}
```

**Constraints:**
- `id` is globally unique
- `name` is globally unique (case-insensitive)
- Only Super Admin can create/edit

### 2. Subcategory Model (NEW - Company-Specific)

**Collection:** `subcategories`

```typescript
interface ISubcategory {
  id: string                    // 6-digit unique ID (e.g., "600001")
  name: string                  // "Managers Full Shirt", "Managers Half Shirt"
  parentCategoryId: ObjectId    // Reference to Category (REQUIRED)
  companyId: ObjectId          // Reference to Company (REQUIRED)
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}
```

**Constraints:**
- `id` is globally unique
- `(parentCategoryId + companyId + name)` is unique (case-insensitive)
- Cannot exist without parent category
- Company Admin can only see/edit their company's subcategories

### 3. ProductSubcategoryMapping Model (NEW - Company-Specific)

**Collection:** `productsubcategorymappings`

```typescript
interface IProductSubcategoryMapping {
  productId: ObjectId          // Reference to Product (REQUIRED)
  subCategoryId: ObjectId       // Reference to Subcategory (REQUIRED)
  companyId: ObjectId          // Reference to Company (REQUIRED)
  companySpecificPrice?: number // Optional price override for this company
  createdAt: Date
  updatedAt: Date
}
```

**Constraints:**
- `(productId + subCategoryId + companyId)` is UNIQUE
- Same product can map to different subcategories for different companies
- Company Admin can only see/edit mappings for their company

### 4. DesignationSubcategoryEligibility Model (NEW - Company-Specific)

**Collection:** `designationsubcategoryeligibilities`

```typescript
interface IDesignationSubcategoryEligibility {
  id: string                    // 6-digit unique ID
  designationId: string         // Designation name (e.g., "General Manager")
  subCategoryId: ObjectId       // Reference to Subcategory (REQUIRED)
  companyId: ObjectId          // Reference to Company (REQUIRED)
  gender?: 'male' | 'female' | 'unisex'
  quantity: number              // Items allowed per cycle
  renewalFrequency: number     // Renewal frequency value
  renewalUnit: 'months' | 'years'
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}
```

**Constraints:**
- `(designationId + subCategoryId + companyId + gender)` is UNIQUE
- Eligibility is defined at subcategory level (not category level)
- Company Admin can only see/edit eligibilities for their company

## API Design

### Super Admin APIs

#### Categories (Global)
- `GET /api/super-admin/categories` - List all categories
- `POST /api/super-admin/categories` - Create category
- `PUT /api/super-admin/categories/:categoryId` - Update category
- `DELETE /api/super-admin/categories/:categoryId` - Soft delete category

**Authorization:** Super Admin only

### Company Admin APIs

#### Subcategories (Company-Scoped)
- `GET /api/categories/:categoryId/subcategories?companyId=X` - Get subcategories for a category
- `POST /api/subcategories` - Create subcategory (requires companyId from auth)
- `PUT /api/subcategories/:subcategoryId` - Update subcategory (validate companyId)
- `DELETE /api/subcategories/:subcategoryId` - Soft delete subcategory (validate companyId)

**Authorization:** Company Admin, companyId validated from auth context

#### Product-Subcategory Mappings (Company-Scoped)
- `GET /api/products/:productId/subcategories?companyId=X` - Get subcategories for a product
- `POST /api/product-subcategory-mappings` - Create mapping (requires companyId from auth)
- `PUT /api/product-subcategory-mappings/:mappingId` - Update mapping (validate companyId)
- `DELETE /api/product-subcategory-mappings/:mappingId` - Delete mapping (validate companyId)

**Authorization:** Company Admin, companyId validated from auth context

#### Designation-Subcategory Eligibilities (Company-Scoped)
- `GET /api/designation-eligibilities?companyId=X` - Get all eligibilities
- `POST /api/designation-subcategory-eligibilities` - Create eligibility (requires companyId from auth)
- `PUT /api/designation-subcategory-eligibilities/:eligibilityId` - Update eligibility (validate companyId)
- `DELETE /api/designation-subcategory-eligibilities/:eligibilityId` - Delete eligibility (validate companyId)

**Authorization:** Company Admin, companyId validated from auth context

## Security & Access Control

### Backend Validation Rules

1. **Company Context Validation:**
   - All Company Admin APIs MUST extract companyId from auth context
   - Reject requests with mismatched companyId
   - Never trust client-provided companyId alone

2. **Parent-Child Validation:**
   - Subcategory creation: Validate parentCategoryId exists and is active
   - Product mapping: Validate subCategoryId belongs to requestor's company
   - Eligibility: Validate subCategoryId belongs to requestor's company

3. **Product Edit Permissions:**
   - Company Admin CANNOT edit: name, description, categoryId, vendor attributes
   - Company Admin CAN edit: company-specific price, subcategory mappings
   - Enforce at API level with authorization checks

## Migration Strategy

### Phase 1: Model Creation
1. Create Subcategory model
2. Create ProductSubcategoryMapping model
3. Create DesignationSubcategoryEligibility model
4. Modify Category model (remove companyId, make global)

### Phase 2: Data Migration
1. Migrate existing categories to global categories
2. Create default subcategories for each company
3. Migrate product-category associations to product-subcategory mappings
4. Migrate designation eligibilities to subcategory level

### Phase 3: API Implementation
1. Implement Super Admin category APIs
2. Implement Company Admin subcategory APIs
3. Implement product-subcategory mapping APIs
4. Implement designation-subcategory eligibility APIs

### Phase 4: UI Implementation
1. Super Admin category management page
2. Company Admin subcategory management page
3. Update product edit page with subcategory selection
4. Update designation eligibility page with subcategory selection

### Phase 5: Backward Compatibility
1. Maintain legacy category references during transition
2. Provide migration utilities
3. Gradual deprecation of old models

## Validation Checklist

### Multi-Company Product Reuse
- [ ] Same product can map to different subcategories for different companies
- [ ] Product mappings are isolated per company
- [ ] No cross-company data leakage in queries

### Eligibility Correctness
- [ ] Eligibility defined at subcategory level
- [ ] Eligibility is company-scoped
- [ ] Eligibility calculations use subcategory mappings

### Access Control Enforcement
- [ ] Backend validates companyId from auth context
- [ ] Company Admin cannot access other companies' data
- [ ] Product edit permissions enforced at API level
- [ ] Super Admin has global access

### Data Integrity
- [ ] Parent-child relationships enforced
- [ ] Unique constraints prevent duplicates
- [ ] Foreign key relationships maintained
- [ ] Soft deletes preserve referential integrity

