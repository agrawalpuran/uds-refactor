# ObjectId to StringId Refactor Roadmap

**Document Type:** Action Plan (NO CODE CHANGES)  
**Created:** 2026-01-14  
**Based On:** OBJECTID_USAGE_SCAN_REPORT.md  
**Total Issues Identified:** 2,000+ instances  

---

## 1️⃣ PRIORITY BREAKDOWN

### Phase 1: CRITICAL (Must Fix First)

| File | Issues | Justification |
|------|--------|---------------|
| `lib/db/data-access.ts` | 1,800+ `_id` accesses, 40+ `findById`, 21 `ObjectId.isValid`, 20+ hex validations | Core data layer - ALL other modules depend on this. Fixing this first prevents cascading failures. |

**Critical Functions in `lib/db/data-access.ts` (Fix in Order):**

1. **Company Lookup Functions** (Lines 2879-3160)
   - `getCompanyById()` - Used by authentication, authorization, order creation
   - `getCompanyByAdminEmail()` - Used by login flow
   - `updateCompanySettings()` - Company settings management

2. **Employee Lookup Functions** (Lines 4945-5687)
   - `getEmployeeByEmail()` - Used by login, order creation, eligibility
   - `getEmployeeById()` - Used throughout order flow
   - `getEmployeeByEmployeeId()` - Employee lookups

3. **Order Creation Functions** (Lines 8505-9503)
   - `createOrder()` - Core order creation with vendorId/productId assignments
   - `validateEmployeeEligibility()` - Eligibility checks before order

4. **Product-Vendor Relationship Functions** (Lines 15500-15710)
   - `createProductVendor()` - Stores `product._id` and `vendor._id`
   - `createProductVendorBatch()` - Batch relationship creation
   - `deleteProductVendor()` - Relationship deletion
   - `getProductsByVendor()` - Product lookups by vendor

5. **Order Status Update Functions** (Lines 10911-11820)
   - `updateOrderStatus()` - Uses `vendor._id.toString()` and `product._id.toString()`

---

### Phase 2: HIGH (Fix After Phase 1)

| File | Issues | Justification |
|------|--------|---------------|
| `app/api/locations/admin/route.ts` | 1 `_id` query | Uses `Company.findOne({ _id: ... })` - Location admin authorization |
| `app/api/prs/shipment/route.ts` | Order lookup patterns | Shipment creation depends on order ID format |
| `app/dashboard/consumer/page.tsx` | 4 `_id` accesses | Consumer dashboard company lookup |

**High Priority Functions in `lib/db/data-access.ts`:**

1. **Order Approval Functions** (Lines 9504-10288)
   - `approveOrder()` - Order approval with company lookups
   - `bulkApproveOrders()` - Bulk approval operations

2. **Purchase Order Functions** (Lines 13184-13628)
   - `createPurchaseOrderFromPRs()` - PO creation from PRs

3. **Admin Functions** (Lines 3458-3855)
   - `addCompanyAdmin()` - Admin assignment
   - `getCompanyAdmins()` - Admin lookups
   - `isCompanyAdmin()` - Admin validation

4. **Location Functions** (Lines 2261-2817)
   - `createLocation()` - Location creation
   - `getLocationsByCompany()` - Location lookups
   - `updateLocation()` - Location updates

---

### Phase 3: MEDIUM (Fix After Phase 2)

| File | Issues | Justification |
|------|--------|---------------|
| `app/api/admin/migrate-productvendors-productids/route.ts` | 5 `_id` refs | Migration endpoint - uses findById for conversions |
| `app/api/admin/migrate-relationships/route.ts` | 2 `_id` queries | Relationship migration - deleteOne with `_id` |

**Medium Priority Functions in `lib/db/data-access.ts`:**

1. **Vendor Functions** (Lines 1912-2070)
   - `getVendorById()` - Vendor lookups
   - `getVendorByEmail()` - Vendor email lookups
   - `updateVendor()` - Vendor updates

2. **Product Functions** (Lines 1369-1870)
   - `getProductById()` - Product lookups
   - `updateProduct()` - Product updates
   - `deleteProduct()` - Product deletion

3. **Branch Functions** (Lines 3161-3456)
   - `getBranchById()` - Branch lookups
   - `getEmployeesByBranch()` - Uses `branch._id`

4. **Feedback Functions** (Lines 18000-20000 range)
   - `getProductFeedback()` - Feedback queries
   - Various feedback lookup functions

---

### Phase 4: LOW (Cleanup)

| File | Issues | Justification |
|------|--------|---------------|
| `scripts/analyze-companyadmins-inconsistency.js` | 2 ObjectId usages | Diagnostic script - not production code |
| `scripts/fix-companyadmins-complete.js` | 3 ObjectId usages | Fix script - needs ObjectId for migration |
| `scripts/migrate-objectid-to-stringid.js` | 2 ObjectId usages | Migration script - intentional ObjectId usage |
| `scripts/verify-string-id-usage.js` | Pattern detection | Verification script - detects ObjectId patterns |

**Low Priority Functions in `lib/db/data-access.ts`:**

1. **Return Request Functions** (Lines 20400-21500 range)
   - `createReturnRequest()` - Return processing
   - `approveReturnRequest()` - Return approval

2. **GRN/Invoice Functions** (Lines 21500-22500 range)
   - Various GRN and Invoice functions

3. **Reporting Functions** (Lines 7294-7576)
   - `getVendorSalesPatterns()` - Vendor reports
   - `getVendorReports()` - Comprehensive reports

---

## 2️⃣ DEPENDENCY ANALYSIS

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE DATA ACCESS LAYER                        │
│                   lib/db/data-access.ts                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  Company    │────▶│  Employee   │────▶│   Order     │        │
│  │  Functions  │     │  Functions  │     │  Functions  │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│        │                   │                   │                 │
│        ▼                   ▼                   ▼                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  Location   │     │   Admin     │     │  Product-   │        │
│  │  Functions  │     │  Functions  │     │  Vendor Rel │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│        │                   │                   │                 │
│        └───────────────────┴───────────────────┘                 │
│                            │                                     │
│                            ▼                                     │
│                   ┌─────────────────┐                            │
│                   │  PO/Shipment/   │                            │
│                   │  GRN Functions  │                            │
│                   └─────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Consumers)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ app/api/prs/    │  │ app/api/orders/ │  │ app/api/        │  │
│  │ shipment/       │  │ *.ts            │  │ locations/admin │  │
│  │ route.ts        │  │                 │  │ /route.ts       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ app/dashboard/  │  │ app/api/admin/  │  │ app/api/        │  │
│  │ consumer/       │  │ migrate-*/      │  │ vendors/        │  │
│  │ page.tsx        │  │ route.ts        │  │ route.ts        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Circular Dependencies Identified

**None found.** The dependency flow is hierarchical:
1. Core functions → Higher-level functions → API routes
2. No API route calls another API route directly
3. Data access functions call each other but in a tree structure

### Functions That MUST Be Refactored Together

**Cluster 1: Company-Employee-CompanyAdmin**
```
getCompanyById() ←──────────┐
getCompanyByAdminEmail() ◄──┼── Must be fixed together
getEmployeeByEmail() ◄──────┤   (Employee lookups depend on Company lookups)
addCompanyAdmin() ◄─────────┤
isCompanyAdmin() ◄──────────┘
```

**Cluster 2: Order-Vendor-Product**
```
createOrder() ◄─────────────┐
getVendorsForProductCompany() ◄──┼── Must be fixed together
createProductVendor() ◄─────┤   (Order creation depends on Product-Vendor)
getProductsByVendor() ◄─────┘
```

**Cluster 3: Order Status Updates**
```
updateOrderStatus() ◄───────┐
updatePRShipmentStatus() ◄──┼── Must be fixed together
updatePRDeliveryStatus() ◄──┤   (All use vendor._id and product._id)
derivePOShippingStatus() ◄──┘
```

**Cluster 4: Location-LocationAdmin**
```
createLocation() ◄──────────┐
getLocationsByCompany() ◄───┼── Must be fixed together
updateLocation() ◄──────────┤   (Location queries with companyId)
getLocationByAdminEmail() ◄─┘
```

---

## 3️⃣ RISK ANALYSIS BEFORE FIXING

### High Risk Modules (Most Likely to Break)

| Module | Risk Level | Specific Failure Points |
|--------|------------|------------------------|
| `createOrder()` | 🔴 CRITICAL | VendorId assignment uses `vendor._id.toString()`. ProductVendor queries use `product._id`. Will cause "product not linked to vendor" errors. |
| `getCompanyByAdminEmail()` | 🔴 CRITICAL | Uses `findById` fallback logic. Login flow will break if company uses string ID but code expects ObjectId. |
| `getEmployeeByEmail()` | 🔴 CRITICAL | Uses `employee.companyId._id.toString()` for company lookup. Employee login will fail. |
| `updateOrderStatus()` | 🔴 HIGH | Uses `vendor._id.toString()` and `product._id.toString()` for inventory updates. Status updates will fail. |
| `createProductVendor()` | 🔴 HIGH | Stores `product._id` instead of `product.id`. All new relationships will be incorrect. |

### Specific Failure Points by Feature

**1. Order Creation Flow**
```
User places order
    ↓
createOrder() called
    ↓
validateEmployeeEligibility() - Uses Company.findById() [MAY FAIL]
    ↓
getVendorsForProductCompany() - Queries ProductVendor with product._id [WILL FAIL]
    ↓
Order created with vendorId = vendor._id.toString() [INCORRECT FORMAT]
    ↓
Order saved with wrong vendorId format
```

**2. Company Admin Login Flow**
```
Admin enters email
    ↓
getCompanyByAdminEmail() called
    ↓
Looks up CompanyAdmin record
    ↓
Gets companyId (could be string ID or ObjectId string)
    ↓
Company.findById(companyId) - [MAY FAIL if string ID]
    ↓
Fallback: Company.findOne({ _id: companyId }) - [MAY FAIL]
    ↓
Login fails
```

**3. Product-Vendor Relationship Creation**
```
Admin links product to vendor
    ↓
createProductVendor(productId, vendorId) called
    ↓
Looks up product by id (correct)
    ↓
Stores productId = product._id (WRONG - stores ObjectId, not string ID)
    ↓
Later queries fail because ProductVendor.productId ≠ product.id
```

### Entities Suffering from ID Mismatches

| Entity | Expected Format | Actual Format in Code | Mismatch Locations |
|--------|----------------|----------------------|-------------------|
| Company | 6-digit string (e.g., "100001") | ObjectId string (24-char hex) | Lines 2661, 5814, 8378, 9556, 9893, 10371, 10562, 10732 |
| Vendor | 6-digit string | `vendor._id.toString()` | Lines 9142-9143, 9281, 11490, 11749 |
| Product | 6-digit string | `product._id.toString()` | Lines 11481, 11492, 11750, 15368, 15686 |
| Employee | 6-digit string | `employee._id.toString()` | Lines 4721, 5143, 18405, 20203 |
| Order | 6-digit string | `order._id.toString()` | Lines 13277, 13382, 14949, 15023 |

### Side Effects of Fixing One Module on Others

| If You Fix... | These Will Break... | Unless You Also Fix... |
|---------------|--------------------|-----------------------|
| `getCompanyById()` | `getCompanyByAdminEmail()`, `isCompanyAdmin()`, `addCompanyAdmin()` | All company lookup functions |
| `getEmployeeByEmail()` | `createOrder()`, `validateEmployeeEligibility()`, login flows | Employee-company conversion logic |
| `createProductVendor()` | Order creation, product availability checks | `getProductsByVendor()`, `getVendorsForProductCompany()` |
| `createOrder()` | Order status updates, shipment creation | `updateOrderStatus()`, `updatePRShipmentStatus()` |
| `updateOrderStatus()` | Inventory tracking, vendor dashboards | All inventory update functions |

---

## 4️⃣ SAFE REFACTOR SEQUENCING

### Step-by-Step Execution Plan

#### Step 1: Backup Current State
```
✓ Create backup: backups/backup-{timestamp}-pre-objectid-refactor/
✓ Document current test results
✓ Tag current commit: pre-objectid-refactor
```

#### Step 2: Fix Company Lookup Functions (Cluster 1)
```
Target Functions:
  - getCompanyById() [Line 2879]
  - getCompanyByAdminEmail() [Line 4672]

Changes:
  - Replace all Company.findById() → Company.findOne({ id: ... })
  - Remove ObjectId.isValid() checks for companyId
  - Remove 24-char hex validation for companyId

Checkpoint:
  □ Test: Company admin login works
  □ Test: Company lookup by ID returns correct company
  □ Verification: grep -r "Company.findById" returns 0 matches
```

#### Step 3: Fix Employee Lookup Functions (Cluster 1 continuation)
```
Target Functions:
  - getEmployeeByEmail() [Line 4945]
  - getEmployeeById() [Line 5344]
  - getEmployeeByEmployeeId() [Line 5638]

Changes:
  - Replace employee.companyId._id.toString() → employee.companyId
  - Remove ObjectId checks for employeeId
  - Remove Employee.findById() calls

Checkpoint:
  □ Test: Employee login works
  □ Test: Employee lookup returns correct employee
  □ Verification: grep -r "Employee.findById" returns 0 matches
```

#### Step 4: Fix CompanyAdmin Functions (Cluster 1 completion)
```
Target Functions:
  - addCompanyAdmin() [Line 3458]
  - removeCompanyAdmin() [Line 3619]
  - isCompanyAdmin() [Line 3857]
  - getCompanyAdmins() [Line 3746]

Changes:
  - Ensure all queries use string IDs
  - Remove newAdmin.companyId._id patterns

Checkpoint:
  □ Test: Add company admin works
  □ Test: Remove company admin works
  □ Test: Admin permission check works
```

#### Step 5: Fix Product-Vendor Relationship Functions (Cluster 2)
```
Target Functions:
  - createProductVendor() [Line 15500]
  - createProductVendorBatch() [Line 15584]
  - deleteProductVendor() [Line 15667]
  - getProductsByVendor() [Line 738]
  - getVendorsForProductCompany() [Line 6704]

Changes:
  - Replace product._id → product.id in all relationship operations
  - Replace vendor._id → vendor.id in all relationship operations
  - Fix ProductVendor queries to use string IDs

Checkpoint:
  □ Test: Create product-vendor relationship works
  □ Test: Query products by vendor returns results
  □ Test: Product availability check works
```

#### Step 6: Fix Order Creation Functions (Cluster 2 continuation)
```
Target Functions:
  - createOrder() [Line 8505]
  - validateEmployeeEligibility() [Line 8190]

Changes:
  - Replace vendor._id.toString() → vendor.id
  - Replace product._id.toString() → product.id
  - Fix vendorId assignment in order creation

Checkpoint:
  □ Test: Order creation works
  □ Test: Order has correct vendorId format
  □ Test: Eligibility validation works
```

#### Step 7: Fix Order Status Update Functions (Cluster 3)
```
Target Functions:
  - updateOrderStatus() [Line 10911]
  - updatePRShipmentStatus() [Line 13746]
  - updatePRDeliveryStatus() [Line 14400]

Changes:
  - Replace vendor._id.toString() → vendor.id
  - Replace product._id.toString() → product.id
  - Fix inventory update operations

Checkpoint:
  □ Test: Order status update works
  □ Test: Shipment status update works
  □ Test: Delivery status update works
```

#### Step 8: Fix Remaining findById Calls
```
Target: All remaining findById() calls in data-access.ts

Changes:
  - Company.findById() → Company.findOne({ id: ... })
  - Vendor.findById() → Vendor.findOne({ id: ... })
  - Order.findById() → Order.findOne({ id: ... })
  - Uniform.findById() → Uniform.findOne({ id: ... })
  - Employee.findById() → Employee.findOne({ id: ... })

Checkpoint:
  □ Verification: grep -r "findById" returns 0 matches in data-access.ts
```

#### Step 9: Fix API Route Files
```
Target Files:
  - app/api/locations/admin/route.ts [Line 116]
  - app/dashboard/consumer/page.tsx [Lines 137, 142, 145, 162]
  - app/api/admin/migrate-productvendors-productids/route.ts
  - app/api/admin/migrate-relationships/route.ts

Changes:
  - Replace Company.findOne({ _id: ... }) → Company.findOne({ id: ... })
  - Replace _id field accesses with id field accesses

Checkpoint:
  □ Test: Location admin route works
  □ Test: Consumer dashboard loads
```

#### Step 10: Remove ObjectId.isValid() and Hex Validations
```
Target: All remaining ObjectId.isValid() checks and hex validations

Changes:
  - Remove all ObjectId.isValid() fallback logic
  - Remove all /^[0-9a-fA-F]{24}$/ regex checks
  - Remove all .length === 24 checks

Checkpoint:
  □ Verification: grep -r "ObjectId.isValid" returns 0 matches
  □ Verification: grep -r "[0-9a-fA-F]{24}" returns 0 matches in .ts files
```

### Rollback Steps

**Per-Step Rollback:**
```bash
# If Step N fails, rollback to checkpoint N-1:
git checkout HEAD~1 -- lib/db/data-access.ts
# Or restore from backup:
cp backups/backup-{timestamp}/lib/db/data-access.ts lib/db/data-access.ts
```

**Full Rollback:**
```bash
# Restore entire backup:
git stash
git checkout pre-objectid-refactor
# Or:
cp -r backups/backup-{timestamp}/* ./
```

---

## 5️⃣ VERIFICATION STRATEGY

### Automated Checks

**Script: `scripts/verify-string-id-usage.js`**
```javascript
// Patterns to detect (should return 0 matches after refactor):
const errorPatterns = [
  /new\s+mongoose\.Types\.ObjectId\(/g,      // new ObjectId() calls
  /\.findById\(/g,                            // findById calls
  /findOne\(\s*\{\s*_id:/g,                   // findOne with _id filter
  /updateOne\(\s*\{\s*_id:/g,                 // updateOne with _id filter
  /deleteOne\(\s*\{\s*_id:/g,                 // deleteOne with _id filter
];

const warningPatterns = [
  /ObjectId\.isValid\(/g,                     // ObjectId.isValid checks
  /mongoose\.Types\.ObjectId\.isValid\(/g,    // mongoose ObjectId.isValid
  /\._id/g,                                   // _id field access (except logging)
  /\.length\s*===?\s*24/g,                    // 24-char length checks
  /\^?\[0-9a-fA-F\]\{24\}\$/g,               // Hex validation regex
];
```

**Verification Commands:**
```bash
# After each step, run:
node scripts/verify-string-id-usage.js

# Check for remaining findById:
grep -r "findById" lib/db/data-access.ts | wc -l  # Should be 0

# Check for remaining ObjectId.isValid:
grep -r "ObjectId.isValid" lib/db/data-access.ts | wc -l  # Should be 0

# Check for remaining _id in queries:
grep -r "findOne.*_id:" lib/db/data-access.ts | wc -l  # Should be 0
```

### Manual Testing Steps

**Test 1: Company Admin Login**
```
1. Go to login page
2. Enter company admin email
3. Verify: Login succeeds
4. Verify: Dashboard shows correct company data
5. Verify: No console errors related to ObjectId
```

**Test 2: Order Creation**
```
1. Login as consumer
2. Navigate to product catalog
3. Add item to cart
4. Place order
5. Verify: Order created successfully
6. Verify: Order shows in vendor dashboard
7. Verify: vendorId in database is 6-digit string
```

**Test 3: Product-Vendor Relationship**
```
1. Login as superadmin
2. Navigate to product management
3. Link product to vendor
4. Verify: Relationship created
5. Query ProductVendor collection
6. Verify: productId and vendorId are 6-digit strings
```

**Test 4: Order Status Update**
```
1. Login as vendor
2. Navigate to orders
3. Update order status to "Dispatched"
4. Verify: Status update succeeds
5. Verify: Inventory decremented correctly
```

**Test 5: Location Admin Authorization**
```
1. Login as location admin
2. Navigate to location dashboard
3. Verify: Dashboard loads
4. Verify: Location data is correct
5. Verify: Can approve orders
```

### Success Criteria (Module Converted Successfully)

| Criterion | Verification Method |
|-----------|-------------------|
| No `findById()` calls | `grep -r "findById" {file}` returns empty |
| No `ObjectId.isValid()` checks | `grep -r "ObjectId.isValid" {file}` returns empty |
| No `._id` in queries | `grep -r "findOne.*_id:" {file}` returns empty |
| No 24-char hex validations | `grep -r "[0-9a-fA-F]{24}" {file}` returns empty |
| All tests pass | Manual tests 1-5 pass |
| No console errors | Browser console shows no ObjectId-related errors |
| Database uses string IDs | Query collection, verify ID format is 6-digit |

---

## 6️⃣ MIGRATION PREPARATION (DO NOT EXECUTE)

### Collections Needing ObjectId→String Reconciliation

| Collection | Fields to Normalize | Current State | Target State |
|------------|--------------------|--------------:|-------------:|
| `productvendors` | `productId`, `vendorId` | Mixed (ObjectId strings + 6-digit) | All 6-digit strings |
| `productcompanies` | `productId`, `companyId` | Mixed | All 6-digit strings |
| `companyadmins` | `companyId`, `employeeId` | Mixed | All 6-digit strings |
| `locationadmins` | `locationId`, `employeeId` | Mixed | All 6-digit strings |
| `orders` | `companyId`, `vendorId`, `employeeId`, `locationId` | Mixed | All 6-digit strings |
| `purchaseorders` | `companyId`, `vendorId` | Mostly correct | Verify all 6-digit |
| `vendorinventories` | `vendorId`, `productId` | Mixed | All 6-digit strings |
| `employees` | `companyId`, `locationId`, `branchId` | Mixed | All 6-digit strings |
| `branches` | `companyId`, `adminId` | Mixed | All 6-digit strings |
| `locations` | `companyId`, `adminId` | Mixed | All 6-digit strings |

### Migration Script Outline (To Generate Later)

```javascript
// Migration script template (DO NOT EXECUTE):
// File: scripts/migrate-all-objectid-to-stringid.js

/*
For each collection:
1. Find all documents with 24-char hex IDs
2. For each document:
   a. Look up the referenced entity by _id
   b. Get the string id field from that entity
   c. Update the document with the string id
3. Log all changes
4. Verify all IDs are now 6-digit strings
*/

const collectionsToMigrate = [
  {
    name: 'productvendors',
    fields: ['productId', 'vendorId'],
    references: {
      productId: { collection: 'uniforms', lookupField: '_id', targetField: 'id' },
      vendorId: { collection: 'vendors', lookupField: '_id', targetField: 'id' }
    }
  },
  {
    name: 'productcompanies',
    fields: ['productId', 'companyId'],
    references: {
      productId: { collection: 'uniforms', lookupField: '_id', targetField: 'id' },
      companyId: { collection: 'companies', lookupField: '_id', targetField: 'id' }
    }
  },
  // ... etc for all collections
];
```

### Fields Requiring Normalization

| Field | Current Format | Normalization Rule |
|-------|---------------|-------------------|
| `companyId` | ObjectId string (24 chars) | Look up Company by `_id`, use Company.`id` |
| `vendorId` | ObjectId string (24 chars) | Look up Vendor by `_id`, use Vendor.`id` |
| `productId` | ObjectId string (24 chars) | Look up Uniform by `_id`, use Uniform.`id` |
| `employeeId` | ObjectId string (24 chars) | Look up Employee by `_id`, use Employee.`id` |
| `locationId` | ObjectId string (24 chars) | Look up Location by `_id`, use Location.`id` |
| `branchId` | ObjectId string (24 chars) | Look up Branch by `_id`, use Branch.`id` |

### Relationship Tables to Update in Sync

**Sync Group 1: Product Relationships**
```
ProductCompany ←→ ProductVendor
  - Must update productId in both simultaneously
  - Must update companyId in ProductCompany
  - Must update vendorId in ProductVendor
```

**Sync Group 2: Admin Relationships**
```
CompanyAdmin ←→ LocationAdmin
  - Must update companyId in CompanyAdmin
  - Must update employeeId in both
  - Must update locationId in LocationAdmin
```

**Sync Group 3: Order Relationships**
```
Order ←→ POOrder ←→ PurchaseOrder
  - Must update order_id in POOrder
  - Must update purchase_order_id in POOrder
  - Must update companyId, vendorId in all
```

---

## 7️⃣ PREPARED REFACTOR PROMPTS (DO NOT USE YET)

### Prompt Execution Order

| Order | Prompt ID | Target | Dependencies | Risk Level |
|-------|-----------|--------|--------------|------------|
| 1 | PROMPT-001 | Company Lookup Functions | None | 🔴 HIGH |
| 2 | PROMPT-002 | Employee Lookup Functions | PROMPT-001 | 🔴 HIGH |
| 3 | PROMPT-003 | CompanyAdmin Functions | PROMPT-001, PROMPT-002 | 🟡 MEDIUM |
| 4 | PROMPT-004 | ProductVendor Relationship Functions | None | 🔴 HIGH |
| 5 | PROMPT-005 | Order Creation Functions | PROMPT-002, PROMPT-004 | 🔴 CRITICAL |
| 6 | PROMPT-006 | Order Status Update Functions | PROMPT-005 | 🔴 HIGH |
| 7 | PROMPT-007 | Order Approval Functions | PROMPT-001, PROMPT-005 | 🟡 MEDIUM |
| 8 | PROMPT-008 | Location Functions | PROMPT-001 | 🟡 MEDIUM |
| 9 | PROMPT-009 | API Route Fixes | PROMPT-001 through PROMPT-008 | 🟡 MEDIUM |
| 10 | PROMPT-010 | Cleanup: Remove ObjectId.isValid | All above | 🟢 LOW |

---

### PROMPT-001: Company Lookup Functions

```
-----------------------------------------------------------
PROMPT-001: Fix Company Lookup Functions in data-access.ts
-----------------------------------------------------------

TARGET FILE: lib/db/data-access.ts
TARGET FUNCTIONS:
  - getCompanyById() [Line 2879]
  - getCompanyByAdminEmail() [Line 4672]

SCOPE: ONLY these 2 functions. DO NOT modify other functions.

CHANGES REQUIRED:

1. In getCompanyById():
   - Remove: Company.findById(companyId)
   - Replace with: Company.findOne({ id: companyId })
   - Remove any ObjectId.isValid() fallback logic

2. In getCompanyByAdminEmail():
   - Remove: Company.findById(companyIdStr) [Line 9557-9558]
   - Replace with: Company.findOne({ id: companyIdStr })
   - Remove: ObjectId.isValid(companyIdStr) && /^[0-9a-fA-F]{24}$/.test(companyIdStr) checks
   - Keep: Company.findOne({ id: companyIdStr }) as the ONLY lookup method

STRICT RULES:
❌ DO NOT modify functions outside the target list
❌ DO NOT remove companyId parameter validation
❌ DO NOT change function signatures
✔ ONLY replace findById with findOne({ id: })
✔ ONLY remove ObjectId fallback logic

VERIFICATION AFTER CHANGES:
  grep -r "Company.findById" lib/db/data-access.ts
  # Expected: 0 matches from target functions
-----------------------------------------------------------
```

---

### PROMPT-002: Employee Lookup Functions

```
-----------------------------------------------------------
PROMPT-002: Fix Employee Lookup Functions in data-access.ts
-----------------------------------------------------------

TARGET FILE: lib/db/data-access.ts
TARGET FUNCTIONS:
  - getEmployeeByEmail() [Line 4945]
  - getEmployeeById() [Line 5344]
  - getEmployeeByEmployeeId() [Line 5638]

SCOPE: ONLY these 3 functions. DO NOT modify other functions.

CHANGES REQUIRED:

1. In getEmployeeByEmail():
   - Remove: employee.companyId._id.toString() patterns [Lines 5405, 5407, 5598, 5600, 5658, 5660, 5674]
   - Replace: Use employee.companyId directly (it should already be string ID)
   - Remove: allCompanies.find((c: any) => c._id.toString() === ...) 
   - Replace with: allCompanies.find((c: any) => c.id === ...)
   - Remove: _id: employee._id?.toString() from return object [Line 4721]
   - Keep: id field in return object

2. In getEmployeeById():
   - Remove: Employee.findById() calls
   - Replace with: Employee.findOne({ id: employeeId })
   - Remove: ObjectId.isValid() checks

3. In getEmployeeByEmployeeId():
   - Remove: any findById() calls
   - Replace with: findOne({ id: }) or findOne({ employeeId: })

STRICT RULES:
❌ DO NOT modify functions outside the target list
❌ DO NOT change the return object structure (except removing _id)
❌ DO NOT remove companyId conversion logic entirely (just fix it)
✔ ONLY replace _id-based lookups with id-based lookups

VERIFICATION AFTER CHANGES:
  grep "employee.companyId._id" lib/db/data-access.ts
  # Expected: 0 matches
-----------------------------------------------------------
```

---

### PROMPT-003: CompanyAdmin Functions

```
-----------------------------------------------------------
PROMPT-003: Fix CompanyAdmin Functions in data-access.ts
-----------------------------------------------------------

TARGET FILE: lib/db/data-access.ts
TARGET FUNCTIONS:
  - addCompanyAdmin() [Line 3458]
  - removeCompanyAdmin() [Line 3619]
  - isCompanyAdmin() [Line 3857]
  - getCompanyAdmins() [Line 3746]
  - canApproveOrders() [Line 4027]

SCOPE: ONLY these 5 functions. DO NOT modify other functions.

CHANGES REQUIRED:

1. In addCompanyAdmin():
   - Remove: newAdmin.companyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(newAdmin.companyId) [Line 2661]
   - Remove: newAdmin.companyId._id || patterns [Line 2652]
   - Ensure: companyId and employeeId are stored as 6-digit strings

2. In isCompanyAdmin():
   - Remove: any Company.findById() calls
   - Replace with: Company.findOne({ id: companyId })

3. In getCompanyAdmins():
   - Remove: admin._id?.toString() patterns [Lines 3934, 3952]
   - Use: admin.id instead

STRICT RULES:
❌ DO NOT modify CompanyAdmin model schema
❌ DO NOT change the function signatures
✔ ONLY fix ID handling within these functions

VERIFICATION AFTER CHANGES:
  grep "newAdmin.companyId._id" lib/db/data-access.ts
  # Expected: 0 matches
-----------------------------------------------------------
```

---

### PROMPT-004: ProductVendor Relationship Functions

```
-----------------------------------------------------------
PROMPT-004: Fix ProductVendor Relationship Functions in data-access.ts
-----------------------------------------------------------

TARGET FILE: lib/db/data-access.ts
TARGET FUNCTIONS:
  - createProductVendor() [Line 15500]
  - createProductVendorBatch() [Line 15584]
  - deleteProductVendor() [Line 15667]
  - getProductsByVendor() [Line 738]
  - getVendorsForProductCompany() [Line 6704]

SCOPE: ONLY these 5 functions. DO NOT modify other functions.

CHANGES REQUIRED:

1. In createProductVendor():
   - Remove: product._id [Lines 15540, 15543]
   - Replace with: product.id
   - Remove: vendor._id [Lines 15543, 15621]
   - Replace with: vendor.id
   - Fix: db.collection('productvendors').find({ productId: product._id })
   - Change to: db.collection('productvendors').find({ productId: product.id })

2. In createProductVendorBatch():
   - Same changes as createProductVendor()

3. In deleteProductVendor():
   - Fix: productIdStr = product._id.toString() [Line 15686]
   - Change to: productIdStr = product.id
   - Fix: vendorIdStr = vendor._id.toString() [Line 15687]
   - Change to: vendorIdStr = vendor.id

4. In getProductsByVendor():
   - Fix: productMap.set(p._id.toString(), p.id) [Line 15368]
   - Change to: productMap.set(p.id, p.id)
   - Fix: vendorMap.set(v._id.toString(), v.id) [Line 15372]
   - Change to: vendorMap.set(v.id, v.id)

5. In getVendorsForProductCompany():
   - Remove: product._id and company._id in logs [Lines 6754, 6796, 6821, 6843]
   - Change to: product.id and company.id

STRICT RULES:
❌ DO NOT modify ProductVendor model schema
❌ DO NOT change the relationship structure
✔ ONLY fix ID handling within these functions

VERIFICATION AFTER CHANGES:
  grep "product._id" lib/db/data-access.ts | grep -v "console.log"
  # Expected: 0 matches (except logging)
-----------------------------------------------------------
```

---

### PROMPT-005: Order Creation Functions

```
-----------------------------------------------------------
PROMPT-005: Fix Order Creation Functions in data-access.ts
-----------------------------------------------------------

TARGET FILE: lib/db/data-access.ts
TARGET FUNCTIONS:
  - createOrder() [Line 8505]
  - validateEmployeeEligibility() [Line 8190]

SCOPE: ONLY these 2 functions. DO NOT modify other functions.

CHANGES REQUIRED:

1. In createOrder():
   - Remove: vendor._id.toString() as vendorKey [Lines 9142-9143]
   - Replace with: vendor.id
   - Remove: vendor._id.toString() in log [Line 9281]
   - Change to: vendor.id
   - Fix vendorId assignment to use vendor.id (6-digit string)

2. In validateEmployeeEligibility():
   - Remove: Company.findById() fallback logic [Line 8378]
   - Remove: ObjectId.isValid(companyId) && /^[0-9a-fA-F]{24}$/.test(companyId) checks
   - Remove: Employee.findById(orderData.employeeId) [Line 8552]
   - Replace with: Employee.findOne({ id: orderData.employeeId })
   - Remove: employee.companyId.toString() !== company._id.toString() [Line 8387]
   - Replace with: employee.companyId !== company.id

STRICT RULES:
❌ DO NOT modify Order model schema
❌ DO NOT change the order creation logic flow
❌ DO NOT remove eligibility validation
✔ ONLY fix ID handling within these functions

VERIFICATION AFTER CHANGES:
  grep "vendor._id.toString()" lib/db/data-access.ts | grep "createOrder"
  # Expected: 0 matches
-----------------------------------------------------------
```

---

### PROMPT-006: Order Status Update Functions

```
-----------------------------------------------------------
PROMPT-006: Fix Order Status Update Functions in data-access.ts
-----------------------------------------------------------

TARGET FILE: lib/db/data-access.ts
TARGET FUNCTIONS:
  - updateOrderStatus() [Line 10911]

SCOPE: ONLY this function. DO NOT modify other functions.

CHANGES REQUIRED:

1. In updateOrderStatus():
   - Remove: vendor._id.toString() [Lines 11490, 11749]
   - Replace with: vendor.id
   - Remove: product._id.toString() [Lines 11481, 11492, 11750]
   - Replace with: product.id
   - Fix: vendorObjectIdToUse = vendor._id [Line 11408]
   - Note: If VendorInventory requires ObjectId, keep the _id lookup but use vendor.id elsewhere

STRICT RULES:
❌ DO NOT modify Order model schema
❌ DO NOT change the status update flow
❌ DO NOT break inventory tracking
✔ ONLY fix ID handling where string IDs should be used
✔ Keep vendor._id ONLY for VendorInventory operations if required

VERIFICATION AFTER CHANGES:
  grep "vendor._id.toString()" lib/db/data-access.ts | grep "updateOrderStatus"
  # Expected: 0 matches (except inventory operations)
-----------------------------------------------------------
```

---

### PROMPT-007: Order Approval Functions

```
-----------------------------------------------------------
PROMPT-007: Fix Order Approval Functions in data-access.ts
-----------------------------------------------------------

TARGET FILE: lib/db/data-access.ts
TARGET FUNCTIONS:
  - approveOrder() [Line 9504]
  - bulkApproveOrders() [Line 10289]
  - approveOrderByParentId() (internal function)

SCOPE: ONLY these functions. DO NOT modify other functions.

CHANGES REQUIRED:

1. In approveOrder():
   - Remove: Company.findById() fallback calls [Lines 9893-9895, 10372-10373, 10563-10564, 10733-10734]
   - Replace with: Company.findOne({ id: companyIdStr })
   - Remove: ObjectId.isValid(companyIdStr) && /^[0-9a-fA-F]{24}$/.test(companyIdStr) checks

2. In bulkApproveOrders():
   - Same changes as approveOrder()

3. Remove company _id logging [Line 9914]:
   - Change: allCompanies.map((c: any) => `id=${c.id}, _id=${c._id?.toString()}`)
   - To: allCompanies.map((c: any) => `id=${c.id}`)

STRICT RULES:
❌ DO NOT modify approval logic flow
❌ DO NOT change PR number assignment
✔ ONLY fix company lookup patterns

VERIFICATION AFTER CHANGES:
  grep "Company.findById" lib/db/data-access.ts | grep -E "approveOrder|bulkApprove"
  # Expected: 0 matches
-----------------------------------------------------------
```

---

### PROMPT-008: Location Functions

```
-----------------------------------------------------------
PROMPT-008: Fix Location Functions in data-access.ts
-----------------------------------------------------------

TARGET FILE: lib/db/data-access.ts
TARGET FUNCTIONS:
  - createLocation() [Line 2261]
  - getLocationsByCompany() [Line 2448]
  - updateLocation() [Line 2585]
  - getLocationByAdminEmail() [Line 4302]

SCOPE: ONLY these functions. DO NOT modify other functions.

CHANGES REQUIRED:

1. In getLocationsByCompany():
   - Remove: Company.findById(location.companyId) [Lines 6280, 6526, 6559]
   - Replace with: Company.findOne({ id: location.companyId })
   - Remove: location.companyId instanceof mongoose.Types.ObjectId checks [Lines 6278, 6524]
   - Remove: ObjectId.isValid(location.companyId) checks

2. In getLocationByAdminEmail():
   - Fix: location.companyId?._id?.toString() patterns [Line 18762]
   - Change to: location.companyId

STRICT RULES:
❌ DO NOT modify Location model schema
❌ DO NOT change admin assignment logic
✔ ONLY fix company lookup patterns

VERIFICATION AFTER CHANGES:
  grep "location.companyId._id" lib/db/data-access.ts
  # Expected: 0 matches
-----------------------------------------------------------
```

---

### PROMPT-009: API Route Fixes

```
-----------------------------------------------------------
PROMPT-009: Fix API Route Files
-----------------------------------------------------------

TARGET FILES:
  - app/api/locations/admin/route.ts [Line 116]
  - app/dashboard/consumer/page.tsx [Lines 137, 142, 145, 162]

SCOPE: ONLY the specified lines in these files.

CHANGES REQUIRED:

1. In app/api/locations/admin/route.ts:
   - Remove: Company.findOne({ _id: (employee as any).companyId }) [Line 116]
   - Replace with: Company.findOne({ id: (employee as any).companyId })

2. In app/dashboard/consumer/page.tsx:
   - Remove: c._id?.toString() patterns [Lines 137, 162]
   - Replace with: c.id
   - Remove: "Found company by ObjectId _id" log [Line 142]
   - Remove: "Error looking up company by _id" log [Line 145]

STRICT RULES:
❌ DO NOT modify other API routes
❌ DO NOT change route logic flow
✔ ONLY fix _id-based queries

VERIFICATION AFTER CHANGES:
  grep "_id:" app/api/locations/admin/route.ts
  # Expected: 0 matches
-----------------------------------------------------------
```

---

### PROMPT-010: Cleanup - Remove ObjectId.isValid

```
-----------------------------------------------------------
PROMPT-010: Remove All ObjectId.isValid Checks
-----------------------------------------------------------

TARGET FILE: lib/db/data-access.ts
SCOPE: All remaining ObjectId.isValid() checks

LOCATIONS TO FIX:
  - Line 6278: location.companyId instanceof mongoose.Types.ObjectId || ...ObjectId.isValid
  - Line 6524: employee.companyId instanceof mongoose.Types.ObjectId || ...ObjectId.isValid
  - Line 8378: ObjectId.isValid(companyId) && /^[0-9a-fA-F]{24}$/.test(companyId)
  - Line 8550: ObjectId.isValid(orderData.employeeId)
  - Line 8587: ObjectId.isValid(employee.locationId)
  - Line 15507: ObjectId.isValid(productId)
  - Line 15604: ObjectId.isValid(productId)
  - Line 17757: ObjectId.isValid(companyId)
  - Line 17902: ObjectId.isValid(companyId)
  - Line 18161: ObjectId.isValid(s)
  - Line 18703: ObjectId.isValid(companyId) && companyId.length === 24
  - Line 18775: ObjectId.isValid(location.companyId)
  - Line 19647: ObjectId.isValid(fb.uniformId)
  - Line 21388: ObjectId.isValid(originalVendorId)

CHANGES REQUIRED:
  - Remove ALL ObjectId.isValid() checks
  - Remove ALL /^[0-9a-fA-F]{24}$/.test() validations
  - Remove ALL .length === 24 checks for IDs
  - Replace fallback logic with direct string ID queries

STRICT RULES:
❌ DO NOT remove null/undefined checks
❌ DO NOT remove type validations (typeof === 'string')
✔ ONLY remove ObjectId-specific validations
✔ Keep string ID validation (e.g., /^\d{6}$/)

VERIFICATION AFTER CHANGES:
  grep "ObjectId.isValid" lib/db/data-access.ts
  # Expected: 0 matches
  grep "[0-9a-fA-F]{24}" lib/db/data-access.ts
  # Expected: 0 matches
-----------------------------------------------------------
```

---

## SUMMARY

### Total Prompts: 10

| Phase | Prompts | Estimated Changes | Risk |
|-------|---------|-------------------|------|
| Phase 1 (Critical) | PROMPT-001 to PROMPT-006 | ~150 lines | 🔴 HIGH |
| Phase 2 (High) | PROMPT-007 to PROMPT-008 | ~50 lines | 🟡 MEDIUM |
| Phase 3 (Medium) | PROMPT-009 | ~20 lines | 🟡 MEDIUM |
| Phase 4 (Cleanup) | PROMPT-010 | ~30 lines | 🟢 LOW |

### Estimated Total Effort
- **Lines of code to change:** ~250 lines
- **Functions to modify:** ~40 functions
- **Files to modify:** 3 files
- **Estimated time:** 4-6 hours (with testing)

### Next Steps (After Approval)
1. Create backup
2. Execute PROMPT-001
3. Test and verify
4. Proceed to next prompt only after previous one passes
5. Complete all prompts
6. Run data migration script
7. Final verification

---

**Document Status:** READY FOR REVIEW  
**Action Required:** Approve plan before executing any prompts
