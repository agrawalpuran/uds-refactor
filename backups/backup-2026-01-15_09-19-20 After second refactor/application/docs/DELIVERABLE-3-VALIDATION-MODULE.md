# 🟣 DELIVERABLE 3 — VALIDATION MODULE DOCUMENTATION

## Overview

The ID Validation Module (`lib/utils/id-validation.ts`) provides utilities to detect and validate ID formats without breaking existing functionality.

## Key Features

- **Non-breaking**: Logs warnings instead of throwing errors (by default)
- **Flexible**: Can be configured for stricter enforcement
- **Comprehensive**: Detects ObjectId instances, hex-strings, and invalid formats
- **Developer-friendly**: Clear warning messages with context

---

## API Reference

### Detection Functions

#### `detectHexString(value: unknown): boolean`

Detects if a value is a 24-character hexadecimal string.

```typescript
import { detectHexString } from '@/lib/utils/id-validation'

detectHexString("507f1f77bcf86cd799439011") // true
detectHexString("100001")                    // false
detectHexString(123)                         // false
detectHexString(null)                        // false
```

#### `detectObjectIdInstance(value: unknown): boolean`

Detects if a value is a MongoDB ObjectId instance.

```typescript
import { detectObjectIdInstance } from '@/lib/utils/id-validation'
import mongoose from 'mongoose'

const objectId = new mongoose.Types.ObjectId()
detectObjectIdInstance(objectId)                    // true
detectObjectIdInstance("507f1f77bcf86cd799439011") // false (string, not instance)
detectObjectIdInstance({ _bsontype: 'ObjectId' })  // true
```

#### `detectInvalidIdFormat(value: unknown): boolean`

Detects if a value is either a hex-string OR ObjectId instance.

```typescript
import { detectInvalidIdFormat } from '@/lib/utils/id-validation'

detectInvalidIdFormat("507f1f77bcf86cd799439011") // true (hex-string)
detectInvalidIdFormat(new mongoose.Types.ObjectId()) // true (ObjectId)
detectInvalidIdFormat("100001") // false (valid string ID)
```

---

### Validation Functions

#### `validateStringId(value: unknown): ValidationResult`

Returns a detailed validation result.

```typescript
import { validateStringId } from '@/lib/utils/id-validation'

// Valid string ID
const result1 = validateStringId("100001")
// { valid: true, type: 'valid-string-id', message: 'Valid string ID', value: "100001" }

// Hex-string (invalid)
const result2 = validateStringId("507f1f77bcf86cd799439011")
// { valid: false, type: 'hex-string', message: 'Expected 6-digit string ID, got 24-char hex string: "507f..."', value: "507f..." }

// ObjectId instance (invalid)
const result3 = validateStringId(new mongoose.Types.ObjectId())
// { valid: false, type: 'objectid', message: 'Expected string ID, got ObjectId instance', value: ObjectId(...) }

// Null/undefined
const result4 = validateStringId(null)
// { valid: false, type: 'empty', message: 'ID value is null or undefined', value: null }
```

#### `validateMultipleIds(ids: Record<string, unknown>, context: string)`

Validates multiple IDs at once.

```typescript
import { validateMultipleIds } from '@/lib/utils/id-validation'

const results = validateMultipleIds({
  companyId: company.id,
  employeeId: employee.id,
  vendorId: vendor.id
}, 'createOrder')

// Returns:
// {
//   companyId: { valid: true, type: 'valid-string-id', ... },
//   employeeId: { valid: true, type: 'valid-string-id', ... },
//   vendorId: { valid: false, type: 'hex-string', ... }
// }
```

---

### Warning/Assertion Functions

#### `warnOnInvalidId(value: unknown, context: string): ValidationResult`

Logs a warning if invalid, but **never throws**. Returns the validation result.

```typescript
import { warnOnInvalidId } from '@/lib/utils/id-validation'

// This will log a warning if companyId is a hex-string or ObjectId
const result = warnOnInvalidId(employee.companyId, 'createEmployee.companyId')
// Console: [ID-VALIDATION] ⚠️ createEmployee.companyId: Expected 6-digit string ID, got 24-char hex string

if (!result.valid) {
  // Handle invalid case (optional)
}
```

#### `assertValidStringId(value: unknown, context: string): string`

In **non-strict mode** (default): Logs warning and returns the string value.
In **strict mode**: Throws an error if invalid.

```typescript
import { assertValidStringId, enableStrictMode } from '@/lib/utils/id-validation'

// Non-strict mode (default) - logs warning, doesn't throw
const companyId = assertValidStringId(employee.companyId, 'createOrder.companyId')
// Returns: "507f1f77bcf86cd799439011" (with warning logged)

// Strict mode - throws error
enableStrictMode()
const companyId = assertValidStringId(employee.companyId, 'createOrder.companyId')
// Throws: Error: [ID-VALIDATION] ❌ createOrder.companyId: Expected 6-digit string ID...
```

---

### Utility Functions

#### `toStringId(value: unknown, context: string): string`

Converts any value to string, with validation warning.

```typescript
import { toStringId } from '@/lib/utils/id-validation'

// ObjectId instance
const id1 = toStringId(company._id, 'getCompanyId')
// Returns: "507f1f77bcf86cd799439011" (with warning)

// Already string
const id2 = toStringId("100001", 'getCompanyId')
// Returns: "100001" (no warning)
```

#### `needsIdMigration(value: unknown): boolean`

Checks if a value should be migrated to string ID.

```typescript
import { needsIdMigration } from '@/lib/utils/id-validation'

needsIdMigration("507f1f77bcf86cd799439011") // true - hex-string
needsIdMigration(new mongoose.Types.ObjectId()) // true - ObjectId
needsIdMigration("100001") // false - already valid
needsIdMigration(null) // false - empty
```

---

### Configuration

#### Enable/Disable Strict Mode

```typescript
import { enableStrictMode, disableStrictMode } from '@/lib/utils/id-validation'

// For testing - throw errors on invalid IDs
enableStrictMode()

// For production - log warnings only
disableStrictMode()
```

#### Enable/Disable Logging

```typescript
import { setLogging } from '@/lib/utils/id-validation'

// Disable logging (silent mode)
setLogging(false)

// Enable logging
setLogging(true)
```

#### Direct Config Access

```typescript
import { ID_VALIDATION_CONFIG } from '@/lib/utils/id-validation'

// Check current config
console.log(ID_VALIDATION_CONFIG.strictMode) // false
console.log(ID_VALIDATION_CONFIG.enableLogging) // true in dev, false in prod
```

---

## Integration Points

### Example 1: In createEmployee function

```typescript
// lib/db/data-access.ts
import { warnOnInvalidId } from '@/lib/utils/id-validation'

export async function createEmployee(data: any) {
  // Validate IDs before creating
  warnOnInvalidId(data.companyId, 'createEmployee.companyId')
  warnOnInvalidId(data.locationId, 'createEmployee.locationId')
  
  // ... existing create logic
}
```

### Example 2: In createOrder function

```typescript
// lib/db/data-access.ts
import { validateMultipleIds } from '@/lib/utils/id-validation'

export async function createOrder(orderData: any) {
  // Validate all IDs at once
  const validationResults = validateMultipleIds({
    employeeId: orderData.employeeId,
    companyId: orderData.companyId,
    vendorId: orderData.vendorId
  }, 'createOrder')
  
  // Log any invalid IDs (already done by validateMultipleIds)
  
  // ... existing create logic
}
```

### Example 3: In ProductVendor creation

```typescript
// lib/db/data-access.ts
import { assertValidStringId } from '@/lib/utils/id-validation'

export async function createProductVendor(productId: string, vendorId: string) {
  // Validate inputs (warns but doesn't throw in production)
  const validProductId = assertValidStringId(productId, 'createProductVendor.productId')
  const validVendorId = assertValidStringId(vendorId, 'createProductVendor.vendorId')
  
  // ... existing create logic
}
```

### Example 4: In API route handlers

```typescript
// app/api/employees/route.ts
import { validateStringId } from '@/lib/utils/id-validation'

export async function POST(request: Request) {
  const data = await request.json()
  
  // Validate companyId from request
  const companyIdValidation = validateStringId(data.companyId)
  if (!companyIdValidation.valid) {
    console.warn(`API /employees POST: Invalid companyId - ${companyIdValidation.message}`)
    // Optionally return error response in future strict mode
  }
  
  // ... process request
}
```

---

## DO NOT INTEGRATE YET

This module is ready for use but should NOT be integrated into production code until:

1. ✅ Migration script has been run to fix existing data
2. ✅ Code changes from Deliverable 2 have been applied
3. ✅ Testing in development environment is complete
4. ✅ Team review of validation approach

---

## Future Enhancements

1. **Strict Mode by Environment**: Auto-enable strict mode in test environments
2. **Metrics Collection**: Track validation failures for monitoring
3. **Schema Validation**: Add Mongoose schema validators using these functions
4. **Migration Helper**: Auto-generate migration scripts from validation failures
