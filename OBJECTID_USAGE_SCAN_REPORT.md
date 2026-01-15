# UDS Codebase ObjectId & _id Usage Scan Report

**Scan Date:** 2026-01-14  
**Scope:** Entire UDS application codebase (excluding /backup folder)  
**Objective:** Identify ALL remaining usage of MongoDB ObjectId and `_id` field access patterns

---

## 1️⃣ ObjectId Imports

### Files with ObjectId Imports

1. **lib/db/data-access.ts** (Line 7)
   - `import mongoose from 'mongoose'` (used for `mongoose.Types.ObjectId`)

2. **scripts/analyze-companyadmins-inconsistency.js** (Line 1)
   - `const mongoose = require('mongoose')`

3. **scripts/fix-companyadmins-complete.js** (Line 1)
   - `const mongoose = require('mongoose')`

4. **scripts/migrate-objectid-to-stringid.js** (Line 1)
   - `const mongoose = require('mongoose')`

5. **scripts/verify-string-id-usage.js** (Line 1)
   - `const mongoose = require('mongoose')`

6. **lib/models/CompanyAdmin-BLR-AA207014.ts** (Lines 4-5)
   - Type definitions using `mongoose.Types.ObjectId` (legacy backup file)

**Total Files with ObjectId Imports:** 6 files (excluding backup folder)

---

## 2️⃣ ObjectId Conversions

### `new ObjectId(...)` Usage

**Total Instances:** 5 (excluding backup folder)

1. **lib/db/data-access.ts**
   - No direct `new ObjectId()` calls found (removed in previous fixes)

2. **scripts/analyze-companyadmins-inconsistency.js** (Line 94)
   - `objectId = new mongoose.Types.ObjectId(lookupValue)`

3. **scripts/fix-companyadmins-complete.js** (Lines 91, 93)
   - Line 91: `: new mongoose.Types.ObjectId(lookupValue._id)`
   - Line 93: `objectId = new mongoose.Types.ObjectId(lookupValue)`

4. **scripts/migrate-objectid-to-stringid.js** (Line 201)
   - `_id: fieldValue instanceof mongoose.Types.ObjectId ? fieldValue : new mongoose.Types.ObjectId(fieldValue)`

### `mongoose.Types.ObjectId.isValid(...)` Usage

**Total Instances:** 21 (in main codebase, excluding backup folder)

**lib/db/data-access.ts:**
- Line 6278: `location.companyId instanceof mongoose.Types.ObjectId || (typeof location.companyId === 'string' && mongoose.Types.ObjectId.isValid(location.companyId))`
- Line 6524: `employee.companyId instanceof mongoose.Types.ObjectId || (typeof employee.companyId === 'string' && mongoose.Types.ObjectId.isValid(employee.companyId))`
- Line 8378: `if (!company && typeof companyId === 'string' && mongoose.Types.ObjectId.isValid(companyId) && /^[0-9a-fA-F]{24}$/.test(companyId))`
- Line 8550: `if (!employee && mongoose.Types.ObjectId.isValid(orderData.employeeId))`
- Line 8587: `isValidObjectId: employee.locationId ? mongoose.Types.ObjectId.isValid(employee.locationId) : false`
- Line 9556: `else if (mongoose.Types.ObjectId.isValid(companyIdStr) && /^[0-9a-fA-F]{24}$/.test(companyIdStr))`
- Line 9893: `else if (mongoose.Types.ObjectId.isValid(companyIdStr) && /^[0-9a-fA-F]{24}$/.test(companyIdStr))`
- Line 10371: `else if (mongoose.Types.ObjectId.isValid(childCompanyIdStr) && /^[0-9a-fA-F]{24}$/.test(childCompanyIdStr))`
- Line 10562: `else if (mongoose.Types.ObjectId.isValid(orderCompanyIdStr) && /^[0-9a-fA-F]{24}$/.test(orderCompanyIdStr))`
- Line 10732: `else if (mongoose.Types.ObjectId.isValid(companyIdStr) && /^[0-9a-fA-F]{24}$/.test(companyIdStr))`
- Line 15507: `if (!product && mongoose.Types.ObjectId.isValid(productId))`
- Line 15604: `if (!product && mongoose.Types.ObjectId.isValid(productId))`
- Line 17757: `if (!company && mongoose.Types.ObjectId.isValid(companyId))`
- Line 17902: `if (!company && mongoose.Types.ObjectId.isValid(companyId))`
- Line 18161: `if (mongoose.Types.ObjectId.isValid(s))`
- Line 18703: `if (companyId && typeof companyId === 'string' && mongoose.Types.ObjectId.isValid(companyId) && companyId.length === 24)`
- Line 18775: `else if (mongoose.Types.ObjectId.isValid(location.companyId))`
- Line 19647: `else if (typeof fb.uniformId === 'string' && mongoose.Types.ObjectId.isValid(fb.uniformId))`
- Line 21388: `if (mongoose.Types.ObjectId.isValid(originalVendorId))`

**Scripts:**
- **scripts/analyze-companyadmins-inconsistency.js**: Used in validation functions
- **scripts/fix-companyadmins-complete.js**: Used in validation functions
- **scripts/migrate-objectid-to-stringid.js**: Used in migration logic

---

## 3️⃣ `_id` Field Access

### Direct `_id` Property Access

**Total Instances:** 1,800+ (excluding backup folder)

**Critical Locations in lib/db/data-access.ts:**

1. **Line 1267:** `_id: p._id?.toString() || String(p._id || '')`
2. **Line 184:** `obj.companyId = obj.companyId._id.toString()`
3. **Line 1949:** `console.log(\`[getVendorByEmail] ✅ Found vendor via regex: ${vendor.name} (id: ${vendor.id}, _id: ${vendor._id?.toString()})\`)`
4. **Line 1963:** `console.log(\`[getVendorByEmail] ✅ Found vendor via manual comparison: ${vendor.name} (id: ${vendor.id}, _id: ${vendor._id?.toString()})\`)`
5. **Line 2248:** `plain._id = c._id.toString()`
6. **Line 3051:** `console.log(\`[updateCompanySettings] Company document _id: ${company._id}, id: ${company.id}\`)`
7. **Line 3798:** `_id: employee._id,`
8. **Line 3934:** `adminId: admin._id?.toString(),`
9. **Line 3952:** `adminId: adminRecord._id?.toString(),`
10. **Line 4721:** `_id: employee._id?.toString(),`
11. **Line 5143:** `console.log(\`[getEmployeeByEmail] Employee ID: ${emp.id || emp.employeeId}, _id: ${emp._id}\`)`
12. **Line 5405:** `const companyIdStr = plainEmployee.companyId._id.toString()`
13. **Line 5407:** `const companyDoc = allCompanies.find((c: any) => c._id.toString() === companyIdStr)`
14. **Line 5421:** `const companyDoc = allCompanies.find((c: any) => c._id.toString() === plainEmployee.companyId)`
15. **Line 5598:** `const companyIdStr = employee.companyId._id.toString()`
16. **Line 5600:** `const companyDoc = allCompanies.find((c: any) => c._id.toString() === companyIdStr)`
17. **Line 5658:** `const companyIdStr = plainEmployee.companyId._id.toString()`
18. **Line 5660:** `const companyDoc = allCompanies.find((c: any) => c._id.toString() === companyIdStr)`
19. **Line 5674:** `const companyDoc = allCompanies.find((c: any) => c._id.toString() === plainEmployee.companyId)`
20. **Line 5729:** `employee.addressId = employee.addressId._id?.toString() || employee.addressId.toString()`
21. **Line 6754:** `console.log(\`[getVendorsForProductCompany] Product _id: ${product._id}, Company _id: ${company._id}\`)`
22. **Line 6796:** `console.error(\`[getVendorsForProductCompany] Product _id: ${product._id}, Company _id: ${company._id}\`)`
23. **Line 6856:** `const vendorMap = new Map<string, { id: string, name: string, _id: any }>()`
24. **Line 6860:** `vendorMap.set(String(v.id), { id: v.id, name: v.name, _id: v._id })`
25. **Line 7128:** `console.log(\`[getOrdersByVendor] ✅ Vendor found: ${vendor.name} (id: ${vendor.id}, _id: ${vendor._id})\`)`
26. **Line 8387:** `if (employee.companyId.toString() !== company._id.toString())`
27. **Line 8426:** `.map(e => e.subCategoryId?._id?.toString() || e.subCategoryId?.toString())`
28. **Line 8469:** `const subcategoryId = mapping.subCategoryId?._id?.toString() || mapping.subCategoryId?.toString()`
29. **Line 8471:** `e => (e.subCategoryId?._id?.toString() || e.subCategoryId?.toString()) === subcategoryId`
30. **Line 9142-9143:** `// CRITICAL FIX: Use vendor._id.toString() as key to ensure consistency` / `const vendorKey = vendor._id.toString()`
31. **Line 9281:** `console.log(\`[createOrder]   Vendor ObjectId: ${vendor._id.toString()}\`)`
32. **Line 9914:** `console.error(\`[approveOrderByParentId] Available companies:\`, allCompanies.map((c: any) => \`id=${c.id}, _id=${c._id?.toString()}\`))`
33. **Line 11481:** `productObjectId: product._id.toString()`
34. **Line 11490-11492:** `vendorId: vendor._id.toString(),` / `productId: product._id.toString(),`
35. **Line 11749-11750:** `vendorId: vendor._id.toString(),` / `productId: product._id.toString()`
36. **Line 13277:** `console.log(\`[createPurchaseOrderFromPRs]   - _id: ${order._id?.toString()}\`)`
37. **Line 13382:** `_id: order._id?.toString(),`
38. **Line 13507:** `sampleVendors.map((v: any) => \`id=${v.id}, _id=${v._id?.toString()}, name=${v.name}\`)`
39. **Line 14949:** `const orderId = mapping.order_id?.toString()`
40. **Line 15004:** `const childOrderIds = splitOrders.map((o: any) => o._id?.toString()).filter(Boolean)`
41. **Line 15023:** `const orderId = order._id?.toString()`
42. **Line 15368:** `productMap.set(p._id.toString(), p.id)`
43. **Line 15372:** `vendorMap.set(v._id.toString(), v.id)`
44. **Line 15543:** `const newVendorIdStr = vendor._id.toString()`
45. **Line 15621:** `const newVendorIdStr = vendor._id.toString()`
46. **Line 15686-15687:** `const productIdStr = product._id.toString()` / `const vendorIdStr = vendor._id.toString()`
47. **Line 16091:** `productId_idValue: pid?._id?.toString ? pid._id.toString() : pid?._id,`
48. **Line 16309:** `const vendorIdStr = v._id.toString()`
49. **Line 16327:** `vendorIdStr = raw.vendorId._id.toString()`
50. **Line 16373:** `vendorIdStr = inv.vendorId._id.toString()`
51. **Line 16388:** `vendorIdStr = rawVendorId._id.toString()`
52. **Line 16413:** `id: inv.vendorId.id || inv.vendorId._id?.toString() || 'N/A',`
53. **Line 18273:** `const productId = product.id || product._id?.toString()`
54. **Line 18405:** `employeeIdStr: employee._id?.toString()`
55. **Line 18762:** `locationCompanyId_id: location.companyId?._id?.toString()`
56. **Line 18986:** `_id: specificFeedbackCheck._id?.toString(),`
57. **Line 19002:** `_id: specificFeedbackCheck._id,`
58. **Line 19289:** `_id: rawOrders[0]._id`
59. **Line 19427:** `_id: rawVendor._id,`
60. **Line 19439:** `_id: rawVendor._id,`
61. **Line 19448:** `_id: v._id,`
62. **Line 19563:** `_id: productVendor._id,`
63. **Line 19772:** `_id: sampleFeedback.vendorId._id?.toString(),`
64. **Line 19783:** `_id: sampleFeedback.uniformId._id?.toString()`
65. **Line 20203:** `_id: f.employeeId._id?.toString() || f.employeeId._id,`
66. **Line 21230:** `console.warn(\`[approveReturnRequest] ⚠️ Error querying vendor by _id:\`, e)`
67. **Line 21417:** `_id: vendorExists._id?.toString(),`
68. **Line 22353:** `const productObjectIdStr = p._id?.toString() || ''`

**Other Files:**
- **app/dashboard/consumer/page.tsx** (Lines 137, 142, 145, 162): Multiple `_id` accesses for company lookup
- **app/api/admin/migrate-productvendors-productids/route.ts** (Lines 127, 143, 162, 178, 187): `_id` references in error messages and queries
- **app/api/locations/admin/route.ts** (Line 116): `Company.findOne({ _id: (employee as any).companyId })`

### `_id.toString()` and `_id.toHexString()` Usage

**Total Instances:** 200+ (excluding backup folder)

All instances listed above in section 3 use `.toString()` on `_id` fields. No `.toHexString()` calls found in main codebase.

---

## 4️⃣ `_id` Used in Queries/Filters

### Database Queries Using `_id`

**Total Instances:** 50+ (excluding backup folder)

**lib/db/data-access.ts:**

1. **Line 2652:** `Company.findOne({ id: String(newAdmin.companyId._id || newAdmin.companyId) })`
2. **Line 3202:** `Employee.find({ branchId: branch._id })`
3. **Line 4220:** `Branch.findOne({ adminId: employee._id })`
4. **Line 4602:** `Employee.find({ companyId: company._id })`
5. **Line 7365:** `Order.find({ vendorId: vendor._id })`
6. **Line 7411:** `Order.find({ vendorId: vendor._id })`
7. **Line 15540:** `db.collection('productvendors').find({ productId: product._id }).toArray()`
8. **Line 15618:** `db.collection('productvendors').find({ productId: product._id }).toArray()`
9. **Line 15847:** `VendorInventory.find({ vendorId: vendor._id }).lean()`

**app/api/locations/admin/route.ts:**
- **Line 116:** `Company.findOne({ _id: (employee as any).companyId })`

**app/api/admin/migrate-relationships/route.ts:**
- **Line 195:** `db.collection('productcompanies').deleteOne({ _id: rel._id })`
- **Line 301:** `db.collection('productvendors').deleteOne({ _id: rel._id })`

**Scripts:**
- **scripts/analyze-companyadmins-inconsistency.js** (Line 98): `db.collection(collectionName).findOne({ _id: objectId })`
- **scripts/fix-companyadmins-complete.js** (Lines 97, 228, 241): Multiple `_id` queries
- **scripts/fix-duplicate-companyadmins.js** (Line 95): `db.collection(collectionName).findOne({ _id: objectId })`

### `findById()` Usage

**Total Instances:** 40+ (excluding backup folder)

**lib/db/data-access.ts:**
- Line 2663: `Company.findById(newAdmin.companyId)`
- Line 3410: `Company.findById(adminEmployee.companyId)`
- Line 6280: `Company.findById(location.companyId)`
- Line 6526: `Company.findById(employee.companyId)`
- Line 6559: `Company.findById(location.companyId)`
- Line 8552: `Employee.findById(orderData.employeeId)`
- Line 9557-9558: `// It's an ObjectId string - use findById` / `company = await Company.findById(companyIdStr)`
- Line 9894-9895: `// It's an ObjectId string - try findById (legacy support)` / `company = await Company.findById(companyIdStr)`
- Line 10372-10373: `// It's an ObjectId string - try findById (legacy support)` / `company = await Company.findById(childCompanyIdStr)`
- Line 10563-10564: `// It's an ObjectId string - try findById (legacy support)` / `company = await Company.findById(orderCompanyIdStr)`
- Line 10733-10734: `// It's an ObjectId string - use findById` / `company = await Company.findById(companyIdStr)`
- Line 10967: `Vendor.findById(orderRaw.vendorId)`
- Line 11236: `Uniform.findById(productObjectId)`
- Line 11468: `Uniform.findById(productObjectId)`
- Line 15047: `Company.findById(companyId).select('_id id').lean()`
- Line 15076: `Company.findById(companyId).select('_id id').lean()`
- Line 15111: `Company.findById(companyId).select('_id id').lean()`
- Line 15231: `Company.findById(companyId).select('_id id').lean()`
- Line 15509: `Uniform.findById(productId)`
- Line 15546: `Vendor.findById(existingLinks[0].vendorId)`
- Line 15606: `Uniform.findById(productId)`
- Line 15624: `Vendor.findById(existingLinks[0].vendorId)`
- Line 16523: `Uniform.findById(productId)`
- Line 17425: `Company.findById(existingEligibility.companyId)`
- Line 17678-17683: `// If it's an object with id property, use that; otherwise try findById` / `: await Company.findById(companyIdValue)`
- Line 18602: `Employee.findById(adminRecord.employeeId).lean()`
- Line 18704: `Company.findById(companyId).select('id').lean()`
- Line 18777: `Company.findById(location.companyId).select('id').lean()`
- Line 20452: `Order.findById(orderId).lean()`
- Line 20628: `Order.findById(requestData.originalOrderId)`
- Line 20746: `Employee.findById(order.employeeId)`
- Line 20783: `Employee.findById(requestData.requestedBy)`
- Line 20972: `Order.findById(rr.originalOrderId)`
- Line 20998: `Vendor.findById(childOrder.vendorId).select('name').lean()`
- Line 21016: `Vendor.findById(originalOrder.vendorId).select('name').lean()`
- Line 21033: `Vendor.findById(originalOrder.vendorId).select('name').lean()`
- Line 21105: `Order.findById(returnRequest.originalOrderId).lean()`
- Line 21162: `Uniform.findById(returnRequest.uniformId).lean()`
- Line 21176: `Employee.findById(originalOrder.employeeId)`
- Line 21236: `Vendor.findById(order.vendorId).lean()`
- Line 21332: `Vendor.findById(originalOrderRaw.vendorId).lean()`
- Line 21390: `Vendor.findById(originalVendorId).lean()`

**app/api/admin/migrate-productvendors-productids/route.ts:**
- Line 122: `Uniform.findById(pv.productId).select('id').lean()`
- Line 157: `Vendor.findById(pv.vendorId).select('id').lean()`

---

## 5️⃣ Hex-ID Validations

### 24-Character Hex String Validations

**Total Instances:** 20+ (excluding backup folder)

**lib/db/data-access.ts:**

1. **Line 2661:** `newAdmin.companyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(newAdmin.companyId)`
2. **Line 5814:** `e.companyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(e.companyId)`
3. **Line 8378:** `mongoose.Types.ObjectId.isValid(companyId) && /^[0-9a-fA-F]{24}$/.test(companyId)`
4. **Line 9556:** `mongoose.Types.ObjectId.isValid(companyIdStr) && /^[0-9a-fA-F]{24}$/.test(companyIdStr)`
5. **Line 9893:** `mongoose.Types.ObjectId.isValid(companyIdStr) && /^[0-9a-fA-F]{24}$/.test(companyIdStr)`
6. **Line 10371:** `mongoose.Types.ObjectId.isValid(childCompanyIdStr) && /^[0-9a-fA-F]{24}$/.test(childCompanyIdStr)`
7. **Line 10562:** `mongoose.Types.ObjectId.isValid(orderCompanyIdStr) && /^[0-9a-fA-F]{24}$/.test(orderCompanyIdStr)`
8. **Line 10732:** `mongoose.Types.ObjectId.isValid(companyIdStr) && /^[0-9a-fA-F]{24}$/.test(companyIdStr)`
9. **Line 15046:** `companyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(companyId)`
10. **Line 15075:** `companyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(companyId)`
11. **Line 15110:** `companyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(companyId)`
12. **Line 15230:** `companyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(companyId)`
13. **Line 18703:** `mongoose.Types.ObjectId.isValid(companyId) && companyId.length === 24`
14. **Line 20451:** `orderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(orderId)`
15. **Line 20627:** `requestData.originalOrderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(requestData.originalOrderId)`
16. **Line 20781:** `requestData.requestedBy.length === 24 && /^[0-9a-fA-F]{24}$/.test(requestData.requestedBy)`
17. **Line 20924:** `companyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(companyId)`
18. **Line 20971:** `rr.originalOrderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(rr.originalOrderId)`
19. **Line 21104:** `returnRequest.originalOrderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(returnRequest.originalOrderId)`

**Scripts:**
- **scripts/analyze-companyadmins-inconsistency.js** (Line 64): `/^[0-9a-fA-F]{24}$/.test(str) && str.length === 24`
- **scripts/fix-companyadmins-complete.js** (Line 64): `/^[0-9a-fA-F]{24}$/.test(str) && str.length === 24`
- **scripts/migrate-objectid-to-stringid.js** (Line 120): `/^[0-9a-fA-F]{24}$/.test(str) && str.length === 24`
- **scripts/verify-string-id-usage.js** (Line 24): Pattern detection for `length === 24` checks

---

## 6️⃣ Entity-Specific Summary

### Companies
- **ObjectId References:** 15+ instances
- **`_id` Queries:** 10+ instances (findById, findOne with _id)
- **Risk:** HIGH - Company lookups use both `findById` and `findOne({ id: ... })` patterns. Legacy ObjectId fallback logic still present.

### Employees
- **ObjectId References:** 12+ instances
- **`_id` Queries:** 8+ instances
- **Risk:** HIGH - Employee queries use `findById` and `_id` field access. CompanyId conversion logic still references ObjectId.

### Vendors
- **ObjectId References:** 10+ instances
- **`_id` Queries:** 6+ instances
- **Risk:** MEDIUM-HIGH - Vendor lookups use `findById` in legacy paths. ProductVendor relationships may have inconsistent ID formats.

### Products (Uniforms)
- **ObjectId References:** 8+ instances
- **`_id` Queries:** 5+ instances
- **Risk:** MEDIUM - Product lookups use `findById` in fallback paths. ProductVendor relationships store `product._id.toString()` in some places.

### Locations
- **ObjectId References:** 5+ instances
- **`_id` Queries:** 2+ instances
- **Risk:** MEDIUM - Location admin queries use `_id` in some paths. CompanyId validation uses ObjectId checks.

### PRs (Orders)
- **ObjectId References:** 15+ instances
- **`_id` Queries:** 12+ instances
- **Risk:** HIGH - Order creation and status updates use `_id` extensively. VendorId and productId stored as `_id.toString()` in some operations.

### POs (Purchase Orders)
- **ObjectId References:** 3+ instances
- **`_id` Queries:** 2+ instances
- **Risk:** LOW-MEDIUM - POOrder mappings use string IDs, but some legacy paths may use ObjectId.

### Orders
- **ObjectId References:** 20+ instances
- **`_id` Queries:** 15+ instances
- **Risk:** HIGH - Order queries use `findById` extensively. VendorId, productId, companyId conversions use `_id.toString()`.

### Invoices
- **ObjectId References:** 2+ instances
- **`_id` Queries:** 1+ instance
- **Risk:** LOW - Minimal ObjectId usage.

### Shipments
- **ObjectId References:** 1+ instance
- **`_id` Queries:** 0 instances
- **Risk:** LOW - Minimal ObjectId usage.

### GRNs
- **ObjectId References:** 2+ instances
- **`_id` Queries:** 1+ instance
- **Risk:** LOW - Minimal ObjectId usage.

### Eligibility
- **ObjectId References:** 3+ instances
- **`_id` Queries:** 1+ instance
- **Risk:** LOW-MEDIUM - Eligibility queries mostly use string IDs.

### Branch
- **ObjectId References:** 2+ instances
- **`_id` Queries:** 2+ instances
- **Risk:** MEDIUM - Branch queries use `branch._id` in Employee lookups.

### Product→Vendor (ProductVendor)
- **ObjectId References:** 8+ instances
- **`_id` Queries:** 4+ instances
- **Risk:** HIGH - ProductVendor relationships use `product._id` and `vendor._id` in queries and creation. Schema expects string IDs but code uses ObjectId.

### Product→Company (ProductCompany)
- **ObjectId References:** 3+ instances
- **`_id` Queries:** 2+ instances
- **Risk:** MEDIUM - ProductCompany relationships mostly fixed but some legacy paths remain.

### Vendor→Warehouse
- **ObjectId References:** 1+ instance
- **`_id` Queries:** 0 instances
- **Risk:** LOW - Minimal usage.

### Company Admins
- **ObjectId References:** 5+ instances
- **`_id` Queries:** 3+ instances
- **Risk:** HIGH - CompanyAdmin schema uses string IDs but queries use `_id` in some paths. Migration scripts still use ObjectId.

### Location Admins
- **ObjectId References:** 2+ instances
- **`_id` Queries:** 1+ instance
- **Risk:** MEDIUM - LocationAdmin schema uses string IDs but some queries may use `_id`.

---

## 7️⃣ Risk Assessment (No Fixes)

### Modules Most at Risk

1. **lib/db/data-access.ts** (CRITICAL)
   - **Risk Level:** CRITICAL
   - **Issues:** 1,800+ `_id` field accesses, 40+ `findById` calls, 21 `ObjectId.isValid` checks, 20+ hex validations
   - **Impact:** Core data access layer has extensive ObjectId usage. Order creation, company lookups, employee queries all affected.

2. **app/api/prs/shipment/route.ts** (HIGH)
   - **Risk Level:** HIGH
   - **Issues:** Order lookups may use ObjectId patterns
   - **Impact:** Shipment creation depends on correct order ID format

3. **app/api/locations/admin/route.ts** (MEDIUM-HIGH)
   - **Risk Level:** MEDIUM-HIGH
   - **Issues:** `Company.findOne({ _id: (employee as any).companyId })` - uses `_id` instead of `id`
   - **Impact:** Location admin lookups may fail if companyId is string ID

4. **app/dashboard/consumer/page.tsx** (MEDIUM)
   - **Risk Level:** MEDIUM
   - **Issues:** Multiple `_id` accesses for company lookup
   - **Impact:** Consumer dashboard may fail to load company data

5. **Migration Scripts** (MEDIUM)
   - **Risk Level:** MEDIUM
   - **Issues:** Scripts use ObjectId for data migration
   - **Impact:** Migration scripts may not work correctly with string ID data

### Features Likely Broken

1. **Order Creation**
   - VendorId and productId stored as `vendor._id.toString()` and `product._id.toString()`
   - ProductVendor relationship queries use `product._id` instead of `product.id`
   - **Impact:** Orders may fail to create or link to incorrect vendors/products

2. **Company Lookups**
   - Multiple `findById` calls with ObjectId strings
   - Fallback logic uses `ObjectId.isValid` and 24-char hex validation
   - **Impact:** Company lookups may fail for string IDs, causing login and authorization failures

3. **Employee Queries**
   - Employee lookups use `findById` in legacy paths
   - CompanyId conversion uses `employee.companyId._id.toString()`
   - **Impact:** Employee queries may fail, affecting order creation and eligibility checks

4. **Product-Vendor Relationships**
   - ProductVendor queries use `product._id` and `vendor._id`
   - Schema expects string IDs but code uses ObjectId
   - **Impact:** Product-vendor relationships may not be found, causing "product not linked to vendor" errors

5. **Location Admin Lookups**
   - Company lookup uses `_id` field instead of `id`
   - **Impact:** Location admin authorization may fail

### Relationships That Will Fail

1. **Product→Vendor (ProductVendor)**
   - **Issue:** Queries use `product._id` and `vendor._id` but schema expects string IDs
   - **Failure Mode:** ProductVendor relationships not found, orders fail to create

2. **Product→Company (ProductCompany)**
   - **Issue:** Some legacy paths use ObjectId
   - **Failure Mode:** Products not available for companies

3. **Company→Employee (CompanyAdmin)**
   - **Issue:** Queries use `_id` in some paths
   - **Failure Mode:** Company admin lookups may fail

4. **Location→Employee (LocationAdmin)**
   - **Issue:** Company lookup uses `_id` instead of `id`
   - **Failure Mode:** Location admin authorization fails

5. **Order→Vendor**
   - **Issue:** VendorId stored as `vendor._id.toString()` in some operations
   - **Failure Mode:** Order-vendor relationships may be incorrect

6. **Order→Product**
   - **Issue:** ProductId stored as `product._id.toString()` in some operations
   - **Failure Mode:** Order-product relationships may be incorrect

### Inconsistent ID Formats

1. **Company IDs**
   - Some code expects 6-digit numeric strings
   - Some code expects 24-char hex strings (ObjectId)
   - Some code uses `findById` (expects ObjectId)
   - Some code uses `findOne({ id: ... })` (expects string ID)
   - **Location:** Throughout `lib/db/data-access.ts`

2. **Vendor IDs**
   - Schema expects 6-digit numeric strings
   - Code uses `vendor._id.toString()` in some places
   - Code uses `findById` in legacy paths
   - **Location:** Order creation, ProductVendor relationships

3. **Product IDs**
   - Schema expects 6-digit numeric strings
   - Code uses `product._id.toString()` in some places
   - Code uses `findById` in legacy paths
   - **Location:** Order creation, ProductVendor relationships

4. **Employee IDs**
   - Schema expects 6-digit numeric strings
   - Code uses `employee._id.toString()` in some places
   - Code uses `findById` in legacy paths
   - **Location:** Employee lookups, CompanyAdmin relationships

---

## 8️⃣ High-Level Impact Summary

### Total Issues Found

- **ObjectId Imports:** 6 files
- **ObjectId Conversions (`new ObjectId`):** 5 instances
- **ObjectId.isValid Checks:** 21 instances
- **`_id` Field Access:** 1,800+ instances
- **`_id` in Queries:** 50+ instances
- **`findById` Usage:** 40+ instances
- **24-char Hex Validations:** 20+ instances
- **Total Estimated Issues:** 2,000+ instances

### Severity Level

**OVERALL SEVERITY: CRITICAL**

The codebase has extensive ObjectId and `_id` usage that will cause failures when:
- Entities use string IDs (6-digit numeric) but code expects ObjectId
- Relationships are queried using `_id` but stored as string IDs
- Fallback logic assumes ObjectId format but data is string ID format

### Dependency Clusters

1. **Core Data Access Cluster** (`lib/db/data-access.ts`)
   - **Dependencies:** All API routes, dashboard pages, business logic
   - **Impact:** CRITICAL - All database operations affected

2. **Order Management Cluster**
   - **Files:** `lib/db/data-access.ts` (order functions), `app/api/prs/shipment/route.ts`, `app/api/orders/*`
   - **Dependencies:** Order creation, status updates, shipment creation
   - **Impact:** HIGH - Order workflow completely broken

3. **Company/Employee Cluster**
   - **Files:** `lib/db/data-access.ts` (company/employee functions), `app/api/locations/admin/route.ts`, `app/dashboard/consumer/page.tsx`
   - **Dependencies:** Authentication, authorization, company lookups
   - **Impact:** HIGH - Login and authorization may fail

4. **Product-Vendor Relationship Cluster**
   - **Files:** `lib/db/data-access.ts` (relationship functions), `lib/models/Relationship.ts`
   - **Dependencies:** Product availability, order creation
   - **Impact:** HIGH - Product-vendor relationships broken

5. **Migration Scripts Cluster**
   - **Files:** `scripts/*.js`
   - **Dependencies:** Data migration, cleanup operations
   - **Impact:** MEDIUM - Migration scripts may not work correctly

### Recommended Sequence for Fixing (High → Low Risk)

#### Phase 1: CRITICAL - Core Data Access (Priority 1)
1. **lib/db/data-access.ts**
   - Replace all `findById` calls with `findOne({ id: ... })`
   - Remove all `ObjectId.isValid` checks
   - Remove all 24-char hex validations
   - Replace `_id` field access with `id` field access
   - Fix ProductVendor relationship queries to use string IDs
   - Fix Company lookups to use string IDs consistently
   - Fix Employee lookups to use string IDs consistently

#### Phase 2: HIGH - Order Management (Priority 2)
2. **Order Creation Functions**
   - Fix vendorId and productId storage to use `vendor.id` and `product.id`
   - Remove `_id.toString()` conversions
   - Fix ProductVendor relationship queries

3. **app/api/prs/shipment/route.ts**
   - Ensure order lookups use string IDs

#### Phase 3: HIGH - Authentication & Authorization (Priority 3)
4. **Company/Employee Lookups**
   - Fix company lookups in authentication paths
   - Fix employee lookups in authorization paths

5. **app/api/locations/admin/route.ts**
   - Replace `Company.findOne({ _id: ... })` with `Company.findOne({ id: ... })`

6. **app/dashboard/consumer/page.tsx**
   - Replace `_id` accesses with `id` field accesses

#### Phase 4: MEDIUM - Relationships (Priority 4)
7. **ProductVendor Relationships**
   - Ensure all queries use string IDs
   - Remove ObjectId conversions

8. **ProductCompany Relationships**
   - Ensure all queries use string IDs

9. **CompanyAdmin Relationships**
   - Ensure all queries use string IDs

10. **LocationAdmin Relationships**
    - Ensure all queries use string IDs

#### Phase 5: LOW - Cleanup (Priority 5)
11. **Migration Scripts**
    - Update scripts to work with string IDs
    - Remove ObjectId dependencies

12. **Remaining Files**
    - Fix any remaining `_id` accesses
    - Remove ObjectId imports where not needed

---

## Summary

The UDS codebase has **2,000+ instances** of ObjectId and `_id` usage that need to be addressed. The core data access layer (`lib/db/data-access.ts`) is the highest priority, containing the majority of issues. Order creation, company lookups, and product-vendor relationships are the most critical features at risk.

**Immediate Action Required:**
1. Fix `lib/db/data-access.ts` - Replace all ObjectId usage with string ID patterns
2. Fix order creation functions - Use `id` fields instead of `_id` fields
3. Fix company/employee lookups - Remove ObjectId fallback logic
4. Fix relationship queries - Use string IDs consistently

**Estimated Effort:** High (2,000+ code changes required across multiple files)
