# Fix "Company information not found" Error in Vercel

## Problem
Employees are getting the error **"Company information not found. Please contact your administrator."** when trying to login on Vercel, but it works fine on localhost.

## Root Cause
This happens when:
1. **Companies are missing the `id` field** - After migrating to MongoDB Atlas, some companies might not have the required 6-digit numeric `id` field
2. **Employee `companyId` references are invalid** - Employee's `companyId` (ObjectId) doesn't match any company `_id` in Atlas
3. **Data mismatch between local and Atlas** - Local database has different data than Atlas

## Solution Steps

### Step 1: Diagnose the Issue

Run the diagnostic script to identify the exact problem:

```bash
# Check specific employee
node scripts/diagnose-vercel-login-issue.js emp1@icicibank.com

# Or check all employees
node scripts/diagnose-vercel-login-issue.js
```

This will show:
- Which companies are missing `id` fields
- Which employees have invalid `companyId` references
- Specific issues with the employee trying to login

### Step 2: Fix Company IDs

If companies are missing `id` fields, run:

```bash
node scripts/fix-company-ids.js
```

This script will:
- Check all companies in MongoDB Atlas
- Ensure each company has a valid 6-digit numeric `id` field
- Create missing `id` fields automatically
- Report any issues

### Step 3: Fix Employee CompanyId References

If employees have invalid `companyId` references, run:

```bash
node scripts/fix-employee-companyid.js
```

This script will:
- Find all employees with invalid `companyId` references
- Match employees to companies correctly
- Update employee `companyId` to correct numeric ID
- Report fixes made

### Step 4: Verify the Fix

Run the diagnostic again to confirm everything is fixed:

```bash
node scripts/diagnose-vercel-login-issue.js emp1@icicibank.com
```

Should show no issues.

### Step 5: Check Vercel Logs

After deploying, check Vercel function logs to see if the error is resolved:

1. Go to Vercel Dashboard → Your Project → Functions
2. Check recent function invocations for `/api/employees` or `/api/companies`
3. Look for the enhanced error messages we added

The enhanced logging will show:
- `[convertCompanyIdToNumericId]` - Company ID conversion attempts
- `[ConsumerLogin]` - Employee login flow details
- Specific error messages when company lookup fails

## Enhanced Error Logging

We've added enhanced error logging that will help diagnose issues in Vercel:

### In `lib/db/data-access.ts`:
- `convertCompanyIdToNumericId()` now logs:
  - When company is not found for ObjectId
  - When company is missing `id` field
  - Invalid companyId formats

### In `app/login/consumer/page.tsx`:
- Enhanced logging for:
  - CompanyId extraction attempts
  - Company lookup failures
  - Employee details when lookup fails

## Common Issues & Solutions

### Issue 1: Companies Missing `id` Field
**Symptom**: `convertCompanyIdToNumericId] ❌ Company found but missing 'id' field!`

**Solution**: Run `node scripts/fix-company-ids.js`

### Issue 2: Employee companyId Doesn't Match Any Company
**Symptom**: `convertCompanyIdToNumericId] ❌ Company not found for ObjectId: ...`

**Solution**: 
1. Check if the company exists in Atlas
2. Run `node scripts/fix-employee-companyid.js` to fix references

### Issue 3: Data Not Migrated to Atlas
**Symptom**: Employee found but company lookup fails

**Solution**: 
1. Verify data exists in MongoDB Atlas
2. Run migration script: `npm run migrate-data-to-atlas`

## Testing

After fixing, test the login flow:

1. **Local Test**:
   ```bash
   npm run dev
   # Try logging in with emp1@icicibank.com
   ```

2. **Vercel Test**:
   - Deploy to Vercel
   - Try logging in on production
   - Check Vercel function logs for any errors

## Prevention

To prevent this issue in the future:

1. **Always run fix scripts after data migration**:
   ```bash
   node scripts/fix-company-ids.js
   node scripts/fix-employee-companyid.js
   ```

2. **Verify data integrity**:
   ```bash
   node scripts/diagnose-vercel-login-issue.js
   ```

3. **Check Vercel logs regularly** for early detection of issues

## Quick Fix Command Sequence

```bash
# 1. Diagnose
node scripts/diagnose-vercel-login-issue.js emp1@icicibank.com

# 2. Fix companies
node scripts/fix-company-ids.js

# 3. Fix employees
node scripts/fix-employee-companyid.js

# 4. Verify
node scripts/diagnose-vercel-login-issue.js emp1@icicibank.com

# 5. Deploy
git add .
git commit -m "Fix employee login companyId issues"
git push
```

## Need Help?

If the issue persists after running the fix scripts:

1. **Check Vercel Logs**: Look for specific error messages
2. **Run Diagnostic**: `node scripts/diagnose-vercel-login-issue.js [email]`
3. **Verify MongoDB Atlas**: Check if data exists and is correct
4. **Check Environment Variables**: Ensure `MONGODB_URI` is set correctly in Vercel

## Related Files

- `scripts/diagnose-vercel-login-issue.js` - Diagnostic script
- `scripts/fix-company-ids.js` - Fix company ID fields
- `scripts/fix-employee-companyid.js` - Fix employee companyId references
- `lib/db/data-access.ts` - Company ID conversion logic
- `app/login/consumer/page.tsx` - Employee login page
