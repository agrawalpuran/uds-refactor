# CRITICAL ENCRYPTION BUG - ROOT CAUSE ANALYSIS

## Problem Statement
Authentication for ALL logins (Super Admin, Company Admin, Vendor, Employee) is broken due to inconsistent encryption/decryption keys.

## Root Cause Analysis

### 1. Encryption Key Loading

**Location:** `lib/utils/encryption.ts` (line 10)
```typescript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production-32-chars!!'
```

**Key Derivation:** (lines 15-22)
```typescript
const getKey = (): Buffer => {
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8')
  // If key is not 32 bytes, hash it to get 32 bytes
  if (key.length !== 32) {
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
  }
  return key
}
```

**Current Key:**
- From `.env.local`: `default-encryption-key-change-in-production-32-chars!!`
- Length: **54 characters** (not 32!)
- **Gets hashed with SHA256** to produce 32-byte key
- Derived key (hex): `d828ba887b75f7ddd6ad0f716380c1ac90930fd0b3ed5b3fe7891ac18cc9bc0b`

### 2. Where Encryption Happens

1. **Employee Model** (`lib/models/Employee.ts`):
   - Pre-save hook (line 195-210): Encrypts fields before saving
   - Uses `encrypt()` from `lib/utils/encryption.ts`
   - **Uses SHA256 hash** if key is not 32 bytes

2. **Data Access Functions** (`lib/db/data-access.ts`):
   - `getEmployeeByEmail()`: Encrypts input email to query database
   - Uses `require('../utils/encryption')` - **Same utility, same key**
   - Multiple fallback methods including decryption-based search

### 3. Where Decryption Happens

1. **Employee Model** (`lib/models/Employee.ts`):
   - Post-find hook (line 213-233): Decrypts fields after retrieving
   - Uses `decrypt()` from `lib/utils/encryption.ts`
   - **Uses SHA256 hash** if key is not 32 bytes

2. **Data Access Functions** (`lib/db/data-access.ts`):
   - `getEmployeeByEmail()`: Decrypts database emails to compare
   - Uses `require('../utils/encryption')` - **Same utility, same key**

### 4. Potential Issues Identified

#### Issue 1: Environment Variable Loading
- ✅ `.env.local` exists and contains correct key
- ✅ Next.js automatically loads `.env.local` for server-side code
- ⚠️ **BUT**: If `process.env.ENCRYPTION_KEY` is not set, falls back to default
- ⚠️ **RISK**: If Next.js doesn't load the env file, default key is used

#### Issue 2: Key Derivation Consistency
- ✅ Main utility (`lib/utils/encryption.ts`) uses SHA256 hash
- ✅ Employee model uses same utility
- ✅ Data access functions use same utility
- ✅ Scripts were fixed to use SHA256 hash (in previous fix)

#### Issue 3: Comparison Logic
- ✅ Login flow: Encrypts input email → queries database
- ✅ Fallback: Decrypts all emails → compares
- ✅ Both methods use same key derivation

### 5. Most Likely Root Cause

**The encryption key IS being loaded correctly and consistently.** However, there might be an issue with:

1. **Timing**: If environment variables aren't loaded when the module is first imported
2. **Caching**: If the encryption utility is cached with a different key
3. **Multiple Instances**: If different parts of the code use different key sources

## Verification Steps

1. ✅ Check if `.env.local` exists → **YES**
2. ✅ Check if key is in `.env.local` → **YES**
3. ✅ Check key derivation logic → **Consistent (SHA256)**
4. ⏳ **TODO**: Verify key is loaded in Next.js runtime
5. ⏳ **TODO**: Test actual login flow with real database data

## Fix Strategy

### Step 1: Ensure Key is Loaded at Module Level
- The key is already loaded at module level (good)
- But we should add logging to verify it's loaded correctly

### Step 2: Verify No Key Overrides
- Check all places where encryption is used
- Ensure all use the same utility function

### Step 3: Add Diagnostic Endpoint
- Created `/api/test-encryption` to verify key loading in runtime

### Step 4: Test with Real Data
- Test login with existing encrypted data
- Verify decryption works correctly

## Files to Check/Fix

1. ✅ `lib/utils/encryption.ts` - Main utility (correct)
2. ✅ `lib/models/Employee.ts` - Uses utility (correct)
3. ✅ `lib/db/data-access.ts` - Uses utility (correct)
4. ✅ Scripts - Fixed to use SHA256 hash (correct)

## Next Steps

1. Test the `/api/test-encryption` endpoint to verify key loading
2. Test actual login flow
3. If key is not loaded, investigate Next.js env loading
4. If key is loaded but decryption fails, check for data encrypted with different key

