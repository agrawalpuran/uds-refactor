# Company ID Encryption/Decryption Analysis

## Summary
**Company ID is NOT encrypted** - it's stored as a plain MongoDB ObjectId reference in the database.

## Current Implementation

### 1. Storage Format
- **Employee Model** (`lib/models/Employee.ts` line 124-128):
  ```typescript
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  }
  ```
  - Stored as **MongoDB ObjectId** (not encrypted)
  - Example: `ObjectId("693d8ce66a37697609a911b5")` for ICICI Bank

- **CompanyAdmin Model**:
  - `companyId`: Stored as **MongoDB ObjectId** (not encrypted)
  - `employeeId`: Stored as **MongoDB ObjectId** (not encrypted)

### 2. What IS Encrypted
The following fields ARE encrypted in employee records:
- `email` - Encrypted (AES-256-CBC)
- `mobile` - Encrypted
- `address` - Encrypted
- `firstName` - Encrypted
- `lastName` - Encrypted
- `designation` - Encrypted

### 3. Company ID Conversion Logic

The system converts companyId from ObjectId to numeric string ID (e.g., "100004") for API responses:

**In `getEmployeeByEmail()`:**
- Fetches raw document with ObjectId
- Looks up company by ObjectId
- Converts to numeric ID: `employee.companyId = companyDoc.id` (e.g., "100004")
- This conversion happens multiple times with fallbacks

**In `getCompanyByAdminEmail()`:**
- Step 1: Gets employee (companyId is converted to numeric ID)
- Step 2: Finds admin record using employee ObjectId
- Step 3: Gets company using admin record's companyId ObjectId
- Returns company with numeric ID

## Potential Issues

### Issue 1: CompanyId Conversion Timing
The conversion from ObjectId to numeric ID happens in `getEmployeeByEmail()`, but the admin record lookup uses ObjectId. This should be fine, but there might be edge cases where:
- Employee's companyId is converted to numeric ID before admin lookup
- Admin record's companyId is still ObjectId
- Comparison might fail if not handled correctly

### Issue 2: Multiple Conversion Attempts
The code has extensive fallback logic (lines 4148-4579 in `data-access.ts`) that tries to convert companyId multiple times. This suggests there have been issues with:
- Mongoose populate failing
- ObjectId not being converted correctly
- Company lookup failing

### Issue 3: Raw Document vs Mongoose Document
The code fetches raw MongoDB documents to get the "true" ObjectId, then converts it. This suggests Mongoose populate might be unreliable.

## Recommendations

### 1. Verify CompanyId Storage
Check if employee records have companyId stored correctly:
```javascript
// Check raw document
const rawEmp = await db.collection('employees').findOne({ email: encryptedEmail })
console.log('Raw companyId:', rawEmp.companyId, typeof rawEmp.companyId)
```

### 2. Verify Admin Record CompanyId
Check if admin records have matching companyId:
```javascript
const admin = await db.collection('companyadmins').findOne({ employeeId: employeeObjectId })
console.log('Admin companyId:', admin.companyId, typeof admin.companyId)
const company = await db.collection('companies').findOne({ _id: admin.companyId })
console.log('Company found:', company?.name, company?.id)
```

### 3. Simplify Conversion Logic
The current code has too many fallback attempts. Consider:
- Always fetch raw document first
- Convert ObjectId to numeric ID once
- Cache the conversion result

### 4. Add Validation
Add validation to ensure:
- Employee companyId matches admin record companyId
- Both are valid ObjectIds
- Company exists in database

## Diagnostic Results

**✅ Diagnostic script confirms:**
- CompanyId is stored as **ObjectId** (not encrypted) ✅
- Employee companyId: `693d8ce66a37697609a911b5` (ICICI Bank)
- Admin record companyId: `693d8ce66a37697609a911b5` (ICICI Bank)
- **CompanyIds match perfectly** ✅
- Company exists and can be found ✅
- All data is correct ✅

## Conclusion

**Company ID is NOT encrypted**, so encryption/decryption is NOT the issue. 

**Diagnostic confirms the data is correct**, so the issue must be in the **login flow logic**, not the data storage.

### Potential Issues in Login Flow:

1. **Timing of ObjectId Conversion**
   - `getEmployeeByEmail()` converts companyId from ObjectId to numeric ID early
   - This conversion might happen before admin record lookup
   - The conversion logic has many fallbacks, suggesting it's been unreliable

2. **Mongoose Populate Failures**
   - The code fetches raw documents to bypass Mongoose populate
   - This suggests populate has failed in the past
   - Multiple fallback attempts indicate reliability issues

3. **Error Handling**
   - If any step in the conversion fails silently, the login might fail
   - The extensive logging suggests debugging has been needed

### Recommendations:

1. **Simplify the conversion logic** - Too many fallbacks make it hard to debug
2. **Add validation** - Verify companyId at each step
3. **Test the actual login flow** - The diagnostic shows data is correct, so test the login endpoint
4. **Check server logs** - The extensive logging should show where it fails

