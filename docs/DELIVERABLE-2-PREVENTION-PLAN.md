# 🔵 DELIVERABLE 2 — PREVENT FUTURE INSERTS OF HEX/OBJECTID

## Overview

This document identifies all code locations where ObjectId or hex-string values are being inserted into the database instead of proper 6-digit string IDs. Each section shows:

- **WHERE**: The exact file and line number
- **WHY**: Why the insert logic is wrong
- **BEFORE**: Current problematic code
- **AFTER**: How to fix it

---

## 1. employees.companyId

### Location
`lib/db/data-access.ts` - `createEmployee()` function

### WHERE (Lines ~5925, ~5976, ~6025, ~6318, ~6457)
```typescript
// Multiple places where employee.companyId is set
companyId: company._id,
```

### WHY
The code assigns `company._id` (ObjectId) instead of `company.id` (string ID) when creating or updating employees.

### BEFORE
```typescript
// Line ~6457
employee.companyId = company._id
```

### AFTER
```typescript
// Use string business ID, not ObjectId
employee.companyId = company.id
```

### Related Patterns to Fix
```typescript
// All occurrences of this pattern:
companyId: company._id  // ❌ WRONG

// Should be:
companyId: company.id   // ✅ CORRECT
```

---

## 2. productcategories.companyId

### Location
`lib/db/category-helpers.ts` - Category creation functions

### WHERE
When creating ProductCategory records, the companyId may be stored as hex-string.

### WHY
The code may be passing `company._id.toString()` instead of `company.id`.

### BEFORE
```typescript
const category = new ProductCategory({
  ...data,
  companyId: companyId // May be ObjectId or hex-string
})
```

### AFTER
```typescript
// Validate companyId is proper 6-digit string
const company = await Company.findOne({ id: companyId })
if (!company) throw new Error('Company not found')

const category = new ProductCategory({
  ...data,
  companyId: company.id // Use validated string ID
})
```

---

## 3. vendorinventories.vendorId and vendorinventories.productId

### Location
`lib/db/data-access.ts` - `ensureVendorInventoryExists()` function

### WHERE (Lines ~16394-16395)
```typescript
export async function ensureVendorInventoryExists(
  vendorId: mongoose.Types.ObjectId | string, 
  productId: mongoose.Types.ObjectId | string,
  ...
)
```

### WHY
The function accepts `mongoose.Types.ObjectId` as input and may store it directly.

### BEFORE
```typescript
export async function ensureVendorInventoryExists(
  vendorId: mongoose.Types.ObjectId | string, 
  productId: mongoose.Types.ObjectId | string,
  session?: mongoose.ClientSession
) {
  // May use vendorId/productId directly without converting to string ID
  const existing = await VendorInventory.findOne({ 
    vendorId: vendorId,  // Could be ObjectId
    productId: productId // Could be ObjectId
  })
  
  if (!existing) {
    await VendorInventory.create({
      vendorId: vendorId,  // ❌ Stores ObjectId
      productId: productId // ❌ Stores ObjectId
    })
  }
}
```

### AFTER
```typescript
export async function ensureVendorInventoryExists(
  vendorId: string, 
  productId: string,
  session?: mongoose.ClientSession
) {
  // Validate inputs are proper 6-digit strings
  if (!/^\d{6}$/.test(vendorId)) {
    throw new Error(`Invalid vendorId format: "${vendorId}". Must be 6-digit string.`)
  }
  if (!/^\d{6}$/.test(productId)) {
    throw new Error(`Invalid productId format: "${productId}". Must be 6-digit string.`)
  }
  
  const existing = await VendorInventory.findOne({ 
    vendorId: vendorId,
    productId: productId
  })
  
  if (!existing) {
    await VendorInventory.create({
      vendorId: vendorId,  // ✅ Validated string ID
      productId: productId // ✅ Validated string ID
    })
  }
}
```

---

## 4. orders.site_admin_approved_by

### Location
`lib/db/data-access.ts` - Order approval functions

### WHERE
When a site admin approves an order, the `site_admin_approved_by` field is set.

### WHY
The code may be storing the admin's `_id` instead of their `id` or `employeeId`.

### BEFORE
```typescript
// In order approval logic
order.site_admin_approved_by = adminEmployee._id // ❌ ObjectId
```

### AFTER
```typescript
// Use string business ID
order.site_admin_approved_by = adminEmployee.id || adminEmployee.employeeId // ✅ String ID
```

---

## 5. poorders.order_id

### Location
`lib/db/data-access.ts` or `lib/db/indent-workflow.ts` - PO Order creation

### WHERE (Lines creating POOrder records)
```typescript
await POOrder.create({
  order_id: order._id, // ❌ ObjectId
  ...
})
```

### WHY
The `order_id` field stores `order._id` (ObjectId) instead of `order.id` (string).

### BEFORE
```typescript
const poOrder = await POOrder.create({
  order_id: order._id,  // ❌ Stores ObjectId
  vendor_id: vendor._id,
  ...
})
```

### AFTER
```typescript
const poOrder = await POOrder.create({
  order_id: order.id,    // ✅ Use string ID
  vendor_id: vendor.id,  // ✅ Use string ID
  ...
})
```

---

## 6. locationadmins.id

### Location
`lib/db/data-access.ts` - `createLocationAdmin()` or similar functions

### WHERE
When creating LocationAdmin records, the `id` field needs proper generation.

### WHY
The `id` field is being set to a hex-string (possibly from `_id.toString()`) instead of a proper 6-digit string.

### BEFORE
```typescript
const locationAdmin = await LocationAdmin.create({
  id: new mongoose.Types.ObjectId().toString(), // ❌ Hex string
  ...
})
```

### AFTER
```typescript
// Generate proper 6-digit ID
const lastAdmin = await LocationAdmin.findOne().sort({ id: -1 }).lean()
const lastId = lastAdmin?.id ? parseInt(lastAdmin.id, 10) : 800000
const newId = String(lastId + 1).padStart(6, '0')

const locationAdmin = await LocationAdmin.create({
  id: newId, // ✅ 6-digit string like "800001"
  ...
})
```

---

## 7. productvendors.id

### Location
`lib/db/data-access.ts` - `createProductVendor()` function

### WHERE (Lines ~15394-15450)
When ProductVendor records are created.

### WHY
The `id` field may be auto-generated as hex-string.

### BEFORE
```typescript
await ProductVendor.create({
  productId: product.id,
  vendorId: vendor.id,
  // id field auto-generated by mongoose as hex
})
```

### AFTER
```typescript
// Generate proper 6-digit ID for ProductVendor
const lastPV = await ProductVendor.findOne().sort({ id: -1 }).lean()
const lastId = lastPV?.id && /^\d{6}$/.test(lastPV.id) ? parseInt(lastPV.id, 10) : 900000
const newId = String(lastId + 1).padStart(6, '0')

await ProductVendor.create({
  id: newId, // ✅ 6-digit string like "900001"
  productId: product.id,
  vendorId: vendor.id,
})
```

---

## 8. shipments.id

### Location
`lib/db/data-access.ts` or `providers/ShiprocketProvider.ts` - Shipment creation

### WHERE
When shipment records are created.

### WHY
The `id` field is being set to a hex-string or auto-generated ObjectId string.

### BEFORE
```typescript
const shipment = await Shipment.create({
  id: new mongoose.Types.ObjectId().toString(), // ❌ Hex string
  ...
})
```

### AFTER
```typescript
// Generate proper 6-digit ID for Shipment
const lastShipment = await Shipment.findOne().sort({ id: -1 }).lean()
const lastId = lastShipment?.id && /^\d{6}$/.test(lastShipment.id) ? parseInt(lastShipment.id, 10) : 700000
const newId = String(lastId + 1).padStart(6, '0')

const shipment = await Shipment.create({
  id: newId, // ✅ 6-digit string like "700001"
  ...
})
```

---

## Summary of Required Changes

| Collection | Field | Current Issue | Fix Required |
|------------|-------|---------------|--------------|
| `employees` | `companyId` | Uses `company._id` | Use `company.id` |
| `productcategories` | `companyId` | May store hex-string | Validate and use string ID |
| `vendorinventories` | `vendorId` | Accepts ObjectId | Validate 6-digit string |
| `vendorinventories` | `productId` | Accepts ObjectId | Validate 6-digit string |
| `orders` | `site_admin_approved_by` | Uses `_id` | Use `id`/`employeeId` |
| `poorders` | `order_id` | Uses `order._id` | Use `order.id` |
| `locationadmins` | `id` | Auto hex-string | Generate 6-digit ID |
| `productvendors` | `id` | Auto hex-string | Generate 6-digit ID |
| `shipments` | `id` | Auto hex-string | Generate 6-digit ID |

---

## Implementation Order

1. **Phase 1: Foreign Key Fields** (highest impact)
   - `employees.companyId`
   - `vendorinventories.vendorId`
   - `vendorinventories.productId`
   - `poorders.order_id`

2. **Phase 2: Approval Fields**
   - `orders.site_admin_approved_by`

3. **Phase 3: ID Generation**
   - `locationadmins.id`
   - `productvendors.id`
   - `shipments.id`

---

## Files to Modify

1. `lib/db/data-access.ts` - Primary data access layer
2. `lib/db/indent-workflow.ts` - Indent/PO workflow
3. `lib/db/category-helpers.ts` - Category operations
4. `providers/ShiprocketProvider.ts` - Shipment creation
5. `app/api/*/route.ts` - Various API endpoints that create records

---

## DO NOT APPLY YET

This document is a plan only. Changes should be applied after:

1. ✅ Migration script has fixed existing data
2. ✅ Validation module is in place
3. ✅ Testing in development environment
4. ✅ Backup of production database
