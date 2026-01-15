# Fix Employee Login "Company information not found" Error in Vercel

## Root Cause Analysis

After deploying to Vercel and migrating to MongoDB Atlas, employees are getting the error:
**"Company information not found. Please contact your administrator."**

### Why This Happens

1. **Employee Login Flow**:
   - Employee enters email → `getEmployeeByEmail()` finds employee
   - Employee has `companyId` (could be ObjectId or numeric string)
   - `convertCompanyIdToNumericId()` tries to convert ObjectId → numeric ID
   - Looks up company document in MongoDB using ObjectId
   - Returns company's `id` field (6-digit numeric string like "100001")
   - **If lookup fails or `id` field is missing → returns `null` → Error shown**

2. **After Atlas Migration**:
   - Companies might be missing the `id` field
   - Employee `companyId` ObjectIds might not match any company in Atlas
   - Database connection might be failing silently

## Diagnostic Steps

### Step 1: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Functions
2. Check recent function invocations for `/api/employees` or `/api/companies`
3. Look for errors like:
   - `convertCompanyIdToNumericId] Error converting companyId`
   - `Failed to convert companyId for employee`
   - MongoDB connection errors

### Step 2: Test API Endpoints Directly

Test these endpoints in your browser or Postman:

```bash
# Test employee lookup
https://your-vercel-app.vercel.app/api/employees?email=emp1@icicibank.com

# Test company lookup
https://your-vercel-app.vercel.app/api/companies

# Test specific company by ID
https://your-vercel-app.vercel.app/api/companies?companyId=100001
```

### Step 3: Verify MongoDB Atlas Data

1. Connect to MongoDB Atlas using MongoDB Compass
2. Check `companies` collection:
   - Do all companies have an `id` field? (should be 6-digit numeric string)
   - Are there any companies without `id`?
3. Check `employees` collection:
   - Find employee with email `emp1@icicibank.com`
   - What is the `companyId` value? (ObjectId or numeric string?)
   - Does the `companyId` ObjectId match a company `_id` in the companies collection?

## Fix Options

### Option 1: Verify and Fix Company `id` Fields (Recommended)

**Problem**: Companies might be missing the `id` field after migration.

**Solution**: Run a script to ensure all companies have valid `id` fields.

**Action Required**: I can create a script `scripts/fix-company-ids.ts` that:
- Checks all companies in MongoDB Atlas
- Ensures each company has a valid 6-digit numeric `id` field
- Creates missing `id` fields if needed
- Reports any issues

### Option 2: Fix Employee `companyId` References

**Problem**: Employee `companyId` might be invalid ObjectIds that don't match any company.

**Solution**: Run a script to fix employee `companyId` references.

**Action Required**: I can create a script `scripts/fix-employee-companyid.ts` that:
- Finds all employees with invalid `companyId` references
- Matches employees to companies by name or other criteria
- Updates employee `companyId` to correct ObjectId or numeric ID
- Reports fixes made

### Option 3: Add Better Error Logging

**Problem**: Current error handling doesn't provide enough diagnostic information.

**Solution**: Enhance logging in `convertCompanyIdToNumericId` and `getEmployeeByEmail`.

**Action Required**: I can update the code to:
- Log more details when `companyId` conversion fails
- Log the employee email and `companyId` value when lookup fails
- Log MongoDB connection status
- Return more detailed error messages (in development mode only)

### Option 4: Add Fallback Logic

**Problem**: If `convertCompanyIdToNumericId` fails, there's no fallback.

**Solution**: Add fallback logic to try alternative methods to find company.

**Action Required**: I can update `app/login/consumer/page.tsx` to:
- Try multiple methods to resolve `companyId`
- Fallback to direct company lookup by name if ObjectId lookup fails
- Provide better error messages

## Recommended Fix Sequence

1. **First**: Add better error logging (Option 3) to diagnose the exact issue
2. **Second**: Fix company `id` fields (Option 1) if missing
3. **Third**: Fix employee `companyId` references (Option 2) if invalid
4. **Fourth**: Add fallback logic (Option 4) for edge cases

## Questions Before Proceeding

1. **Can you check Vercel function logs** and share any errors related to `convertCompanyIdToNumericId` or `getEmployeeByEmail`?

2. **Can you verify in MongoDB Atlas**:
   - Do all companies have an `id` field?
   - Does the employee `emp1@icicibank.com` have a `companyId`?
   - What is the value of that `companyId`?

3. **Which fix option would you prefer**:
   - Start with diagnostic logging (Option 3)?
   - Fix company `id` fields first (Option 1)?
   - Fix employee `companyId` references first (Option 2)?
   - All of the above?

## Fix Scripts Created ✅

I've created the following scripts to diagnose and fix the issue:

### 1. Diagnostic Script
**File**: `scripts/diagnose-companyid-conversion.js`
- Checks employee 300032 and similar cases
- Verifies all companies have `id` fields
- Identifies employees with invalid `companyId` references
- Provides detailed diagnostic report

**Run**: `node scripts/diagnose-companyid-conversion.js`

### 2. Fix Company IDs Script
**File**: `scripts/fix-company-ids.js`
- Ensures all companies have valid 6-digit numeric `id` fields
- Creates missing `id` fields automatically
- Generates new IDs starting from the highest existing ID

**Run**: `node scripts/fix-company-ids.js`

### 3. Fix Employee companyId Script
**File**: `scripts/fix-employee-companyid.js`
- Repairs employee `companyId` references
- Converts ObjectId references to numeric IDs
- Matches employees to correct companies

**Run**: `node scripts/fix-employee-companyid.js`

### 4. Enhanced Error Logging
**File**: `lib/db/data-access.ts`
- Added detailed error logging to `convertCompanyIdToNumericId()`
- Logs when companies are missing `id` fields
- Provides actionable error messages

## Recommended Fix Sequence

Based on the Vercel log showing `companyId: null` for employee 300032:

### Step 1: Run Diagnostic (Local)
```bash
node scripts/diagnose-companyid-conversion.js
```

This will show:
- Which companies are missing `id` fields
- Which employees have invalid `companyId` references
- Specific issues with employee 300032

### Step 2: Fix Company IDs (Local)
```bash
node scripts/fix-company-ids.js
```

This ensures all companies have valid `id` fields.

### Step 3: Fix Employee companyId References (Local)
```bash
node scripts/fix-employee-companyid.js
```

This repairs employee `companyId` references.

### Step 4: Verify Fix (Local)
```bash
node scripts/diagnose-companyid-conversion.js
```

Should show no issues.

### Step 5: Deploy to Vercel
After fixing locally, commit and push to trigger Vercel deployment:
```bash
git add .
git commit -m "Fix employee companyId conversion issues"
git push
```

## Expected Results

After running the fix scripts:
- ✅ All companies will have valid `id` fields
- ✅ All employees will have valid `companyId` references (numeric IDs)
- ✅ Employee login should work without "Company information not found" error
- ✅ Vercel logs will show successful `companyId` conversion

## Next Steps

1. **Run the diagnostic script locally** to see the exact issues
2. **Run the fix scripts** in sequence
3. **Verify the fixes** work locally
4. **Deploy to Vercel** and test employee login

