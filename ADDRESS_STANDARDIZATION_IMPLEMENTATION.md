# Address Standardization Implementation - UDS

**Status:** Phase 1 Complete - Foundation & Models  
**Date:** December 30, 2025

## Overview

This document tracks the implementation of standardized address structure across the Uniform Distribution System (UDS). The goal is to replace all free-form address fields with a consistent, structured address model (L1-L3, City, State, Pincode).

---

## ✅ COMPLETED (Phase 1)

### 1. Database Models

#### ✅ Address Model (`lib/models/Address.ts`)
- Created standardized Address model with:
  - `address_line_1` (L1) - House/Building/Street (REQUIRED)
  - `address_line_2` (L2) - Area/Locality (OPTIONAL)
  - `address_line_3` (L3) - Landmark (OPTIONAL)
  - `city` (REQUIRED)
  - `state` (REQUIRED)
  - `pincode` (REQUIRED, 6 digits)
  - `country` (DEFAULT: 'India')
- Indexes: pincode, city+state, state

#### ✅ Updated Entity Models
All models now have `addressId` reference (backward compatible):

- **Vendor** (`lib/models/Vendor.ts`)
  - Added: `addressId?: mongoose.Types.ObjectId`
  
- **Employee** (`lib/models/Employee.ts`)
  - Added: `addressId?: mongoose.Types.ObjectId`
  - Kept: `address: string` (DEPRECATED, for backward compatibility)

- **Order** (`lib/models/Order.ts`)
  - Added: `shippingAddressId?: mongoose.Types.ObjectId`
  - Kept: `deliveryAddress: string` (DEPRECATED, for backward compatibility)

- **Location** (`lib/models/Location.ts`)
  - Added: `addressId?: mongoose.Types.ObjectId`
  - Kept: `address`, `city`, `state`, `pincode` (DEPRECATED, for backward compatibility)

- **Branch** (`lib/models/Branch.ts`)
  - Added: `addressId?: mongoose.Types.ObjectId`
  - Kept: `address`, `city`, `state`, `pincode` (DEPRECATED, for backward compatibility)

### 2. Address Service (`lib/utils/address-service.ts`)

Created comprehensive address utilities:

- ✅ `validateAddress()` - Validates address data
- ✅ `createAddress()` - Creates new address record
- ✅ `updateAddress()` - Updates existing address
- ✅ `getAddressById()` - Retrieves address by ID
- ✅ `formatAddress()` - Formats address for display
- ✅ `formatAddressSingleLine()` - Compact single-line format
- ✅ `parseLegacyAddress()` - Parses free-form text into structured format (for migration)

### 3. Migration Script (`scripts/migrate-addresses.ts`)

- ✅ Created migration script to backfill addresses from existing data
- ✅ Migrates: Employees, Orders, Locations, Branches
- ✅ Preserves original data for backward compatibility
- ✅ Handles parsing of legacy free-form addresses
- ✅ Command: `npm run migrate-addresses`

### 4. UI Components

#### ✅ AddressForm Component (`components/AddressForm.tsx`)
- Standardized address input form
- Features:
  - Structured fields (L1, L2, L3, City, State, Pincode)
  - Validation
  - Pincode-based city/state auto-fill (common Indian pincodes)
  - Consistent styling
  - Error handling

---

## 🔄 IN PROGRESS / PENDING (Phase 2)

### 5. Data Access Functions (`lib/db/data-access.ts`)

**Status:** PENDING

Need to update:
- `createEmployee()` - Accept structured address, create Address record
- `updateEmployee()` - Handle address updates
- `createOrder()` - Use shippingAddressId
- `createLocation()` - Use addressId
- `createBranch()` - Use addressId
- `createVendor()` - Use addressId (if vendor address is added)

**Approach:**
- Functions should accept both legacy (string) and new (AddressInput) formats
- Auto-create Address records when structured data provided
- Populate addressId when fetching entities

### 6. API Routes

**Status:** PENDING

Need to update:
- `POST /api/employees` - Accept structured address
- `PUT /api/employees/[id]` - Handle address updates
- `POST /api/orders` - Accept shipping address
- `POST /api/locations` - Accept structured address
- `POST /api/vendors` - Accept address (if vendor address feature added)

**Approach:**
- Accept both legacy and new formats (backward compatibility)
- Validate using `validateAddress()`
- Create/update Address records via service
- Return formatted addresses in responses

### 7. UI Forms Update

**Status:** PENDING

Need to update forms to use `AddressForm` component:

- ✅ `components/AddressForm.tsx` - Created
- ⏳ `app/dashboard/company/employees/page.tsx` - Replace textarea with AddressForm
- ⏳ `app/dashboard/consumer/profile/page.tsx` - Replace textarea with AddressForm
- ⏳ `app/dashboard/company/locations/page.tsx` - Replace address fields with AddressForm
- ⏳ `app/dashboard/superadmin/page.tsx` - Add AddressForm for vendors (if vendor address feature added)
- ⏳ Order checkout/shipping forms - Use AddressForm

**Approach:**
- Replace free-form textarea/inputs with `<AddressForm />`
- Map form data to AddressFormData interface
- Handle both create and update scenarios

---

## 📋 MIGRATION STRATEGY

### Step 1: Run Migration Script
```bash
npm run migrate-addresses
```

This will:
- Create Address records from existing data
- Update entities with addressId references
- Preserve original fields for backward compatibility

### Step 2: Update Data Access Functions
- Modify functions to create Address records when structured data provided
- Populate addressId when fetching entities
- Support both legacy and new formats

### Step 3: Update API Routes
- Accept structured address in request bodies
- Create/update Address records
- Return formatted addresses

### Step 4: Update UI Forms
- Replace address inputs with AddressForm component
- Update form submission handlers
- Test all address entry flows

### Step 5: Verification
- Verify all addresses migrated correctly
- Test create/update flows
- Verify backward compatibility

### Step 6: Remove Legacy Fields (Future Release)
- After full migration verified
- Remove deprecated address fields from models
- Update all references

---

## 🔍 BACKWARD COMPATIBILITY

### Current State
- ✅ All legacy address fields preserved
- ✅ addressId fields are optional
- ✅ Migration script preserves original data
- ✅ Service functions handle both formats

### Migration Path
1. **Phase 1 (Current):** Models support both formats
2. **Phase 2:** Functions accept both, prefer new format
3. **Phase 3:** UI uses new format, backend converts legacy
4. **Phase 4:** All data migrated, legacy fields deprecated
5. **Phase 5 (Future):** Remove legacy fields

---

## 📝 USAGE EXAMPLES

### Creating Address via Service
```typescript
import { createAddress } from '@/lib/utils/address-service'

const address = await createAddress({
  address_line_1: '123 Main Street',
  address_line_2: 'Sector 5',
  address_line_3: 'Near Metro Station',
  city: 'New Delhi',
  state: 'Delhi',
  pincode: '110001',
  country: 'India'
})
```

### Using AddressForm Component
```tsx
import AddressForm from '@/components/AddressForm'

<AddressForm
  value={addressData}
  onChange={(address) => setAddressData(address)}
  required={true}
  errors={errors}
/>
```

### Formatting Address for Display
```typescript
import { formatAddress } from '@/lib/utils/address-service'

const displayAddress = formatAddress(address)
// Output: "123 Main Street, Sector 5, Near Metro Station, New Delhi, Delhi, 110001"
```

---

## ⚠️ IMPORTANT NOTES

1. **Migration Required:** Run `npm run migrate-addresses` before using new address structure
2. **Backward Compatibility:** Legacy fields preserved, but new code should use addressId
3. **Validation:** All addresses must have L1, City, State, Pincode (required fields)
4. **Pincode Format:** Must be exactly 6 digits (Indian format)
5. **Country Default:** Defaults to 'India' if not specified

---

## 🚀 NEXT STEPS

1. **Install tsx** (if not already installed):
   ```bash
   npm install --save-dev tsx
   ```

2. **Run Migration**:
   ```bash
   npm run migrate-addresses
   ```

3. **Update Data Access Functions** (Priority: High)
   - Start with `createEmployee()` and `updateEmployee()`
   - Then `createOrder()`, `createLocation()`, etc.

4. **Update API Routes** (Priority: High)
   - Update employee APIs first
   - Then order, location APIs

5. **Update UI Forms** (Priority: Medium)
   - Start with employee form
   - Then location, order forms

6. **Testing** (Priority: High)
   - Test address creation
   - Test address updates
   - Test migration
   - Test backward compatibility

---

## 📚 RELATED FILES

- `lib/models/Address.ts` - Address model
- `lib/utils/address-service.ts` - Address service utilities
- `components/AddressForm.tsx` - Address form component
- `scripts/migrate-addresses.ts` - Migration script
- `lib/models/Employee.ts` - Updated with addressId
- `lib/models/Order.ts` - Updated with shippingAddressId
- `lib/models/Location.ts` - Updated with addressId
- `lib/models/Branch.ts` - Updated with addressId
- `lib/models/Vendor.ts` - Updated with addressId

---

**Last Updated:** December 30, 2025  
**Next Review:** After Phase 2 completion

