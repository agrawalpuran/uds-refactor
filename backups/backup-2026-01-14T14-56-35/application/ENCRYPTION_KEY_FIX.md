# Encryption Key Consistency Fix

## Issue Found

**Problem:** Encryption and decryption were using **different keys**, causing decryption failures.

### Root Cause

1. **`lib/utils/encryption.ts` (Main Utility):**
   - Uses `getKey()` function that:
     - If key is exactly 32 bytes → uses directly
     - If key is NOT 32 bytes → **hashes with SHA256**: `crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()`

2. **Scripts (e.g., `create-diageo-and-admin.js`, `add-vikram-kumar-as-admin.js`):**
   - Used: `Buffer.from(ENCRYPTION_KEY.substring(0, 32).padEnd(32))`
   - This just truncates/pads the key to 32 characters - **NO HASHING**

### Impact

- Default key: `'default-encryption-key-change-in-production-32-chars!!'` (54 characters)
- Utility key: SHA256 hash of the key → `d828ba887b75f7ddd6ad0f716380c1ac90930fd0b3ed5b3fe7891ac18cc9bc0b`
- Script key: First 32 chars → `64656661756c742d656e6372797074696f6e2d6b65792d6368616e67652d696e`
- **These are DIFFERENT**, so:
  - Data encrypted by utility **CANNOT** be decrypted by scripts
  - Data encrypted by scripts **CANNOT** be decrypted by utility

## Fix Applied

Updated scripts to use the **same key derivation** as the utility:

```javascript
// Get encryption key - same logic as lib/utils/encryption.ts
function getKey() {
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8')
  // If key is not 32 bytes, hash it to get 32 bytes (same as utility)
  if (key.length !== 32) {
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
  }
  return key
}
```

## Files Fixed

1. ✅ `scripts/create-diageo-and-admin.js`
2. ✅ `scripts/add-vikram-kumar-as-admin.js`

## Verification

Run the test script to verify keys match:
```bash
node scripts/test-encryption-key-consistency.js
```

**Result:** ✅ Keys now match! Encryption/decryption will work correctly.

## Other Scripts That May Need Fixing

The following scripts also use the old method and should be updated:
- `scripts/diagnose-companyid-matching.js`
- `scripts/test-vikram-decryption.js`
- `scripts/recreate-vikram-admin.js`
- `scripts/verify-vikram-in-db.js`
- `scripts/fix-vikram-employee-id.js`
- `scripts/check-icici-employees.js`
- `scripts/fix-anjali-email-encryption.js`
- `scripts/verify-anjali-exists.js`
- And potentially others...

## Recommendation

1. **Update all scripts** to use the `getKey()` function pattern
2. **Test encryption/decryption** with existing data to ensure compatibility
3. **Consider creating a shared encryption utility** that scripts can import instead of duplicating code

