# 🔍 Vercel + MongoDB Atlas Troubleshooting Guide

## Issue: No Data Being Fetched in Vercel Deployment

If your Vercel deployment is connected to MongoDB Atlas but not showing data, follow these steps:

---

## ✅ Step 1: Verify Environment Variables in Vercel

### Check Required Variables

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project (`uds-new`)

2. **Navigate to Environment Variables:**
   - Go to **Settings** → **Environment Variables**

3. **Verify These Variables Exist:**

   | Variable | Expected Value | Status |
   |----------|---------------|--------|
   | `MONGODB_URI` | `mongodb+srv://admin:Welcome%40123@cluster0.5g85nve.mongodb.net/uniform-distribution?retryWrites=true&w=majority` | ⬜ |
   | `ENCRYPTION_KEY` | `default-encryption-key-change-in-production-32-chars!!` | ⬜ |
   | `NODE_ENV` | `production` (optional) | ⬜ |

4. **Check Environment Scope:**
   - Ensure variables are set for **Production** environment
   - Optionally set for Preview and Development too

5. **Important:** After adding/updating variables, you **MUST redeploy**:
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**

---

## ✅ Step 2: Verify MongoDB Atlas Network Access

### Check IP Whitelist

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com/
   - Log in to your account

2. **Navigate to Network Access:**
   - Click **Network Access** (left sidebar)
   - Check IP Access List

3. **Required Configuration:**
   - **Must have:** `0.0.0.0/0` (Allow Access from Anywhere)
   - This allows Vercel's dynamic IPs to connect

4. **If Missing:**
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"**
   - Click **"Confirm"**
   - Wait 1-2 minutes for changes to propagate

---

## ✅ Step 3: Verify Connection String Format

### Your Current Atlas Connection String

```
mongodb+srv://admin:Welcome%40123@cluster0.5g85nve.mongodb.net/uniform-distribution?retryWrites=true&w=majority
```

### Key Points:
- ✅ Protocol: `mongodb+srv://` (correct for Atlas)
- ✅ Username: `admin`
- ✅ Password: `Welcome%40123` (URL-encoded: `@` = `%40`)
- ✅ Cluster: `cluster0.5g85nve.mongodb.net`
- ✅ Database: `/uniform-distribution` (before the `?`)
- ✅ Options: `?retryWrites=true&w=majority`

### Common Mistakes:
- ❌ Missing database name: `/uniform-distribution`
- ❌ Password not URL-encoded: `Welcome@123` (wrong) vs `Welcome%40123` (correct)
- ❌ Wrong cluster URL
- ❌ Missing `?retryWrites=true&w=majority`

---

## ✅ Step 4: Check Vercel Deployment Logs

### View Build Logs

1. **Go to Deployments:**
   - Vercel Dashboard → Your Project → **Deployments**

2. **Open Latest Deployment:**
   - Click on the latest deployment

3. **Check Build Logs:**
   - Look for: `✅ MongoDB Connected Successfully`
   - Look for errors: `❌ MongoDB Connection Failed`

4. **Check Function Logs:**
   - Go to **Functions** tab
   - Look for API route errors
   - Check for connection timeouts or authentication errors

### Common Error Messages:

| Error | Cause | Solution |
|-------|-------|----------|
| `ENOTFOUND` | Cluster URL incorrect | Verify cluster name in Atlas |
| `authentication failed` | Wrong username/password | Check credentials |
| `IP not whitelisted` | Network access blocked | Add `0.0.0.0/0` to whitelist |
| `Invalid scheme` | Connection string malformed | Check format |
| `querySrv ENOTFOUND` | DNS resolution failed | Check cluster URL |

---

## ✅ Step 5: Test API Endpoints

### Test from Browser

1. **Open your Vercel URL:**
   - Example: `https://your-project.vercel.app`

2. **Test API Endpoints:**
   - `https://your-project.vercel.app/api/products`
   - `https://your-project.vercel.app/api/employees`
   - `https://your-project.vercel.app/api/companies`

3. **Expected Response:**
   - Should return JSON array with data
   - If empty array `[]`, data might not be migrated
   - If error, check the error message

### Test with curl (Terminal)

```powershell
# Test products endpoint
Invoke-WebRequest -Uri "https://your-project.vercel.app/api/products" | Select-Object StatusCode, Content

# Test employees endpoint
Invoke-WebRequest -Uri "https://your-project.vercel.app/api/employees" | Select-Object StatusCode, Content
```

---

## ✅ Step 6: Verify Data in MongoDB Atlas

### Check via MongoDB Compass

1. **Connect MongoDB Compass to Atlas:**
   - Connection string: `mongodb+srv://admin:Welcome%40123@cluster0.5g85nve.mongodb.net/uniform-distribution?retryWrites=true&w=majority`

2. **Verify Collections:**
   - Check `employees` collection (should have 40 documents)
   - Check `companies` collection (should have 4 documents)
   - Check `uniforms` collection (should have 14 documents)

3. **If Collections Are Empty:**
   - Data migration might have failed
   - Re-run migration: `node scripts/migrate-data-to-atlas.js`

---

## ✅ Step 7: Debugging Checklist

### Quick Verification Steps

- [ ] Environment variables set in Vercel Dashboard
- [ ] Variables set for Production environment
- [ ] Redeployed after adding variables
- [ ] Network access allows `0.0.0.0/0` in Atlas
- [ ] Connection string format is correct
- [ ] Password is URL-encoded (`@` = `%40`)
- [ ] Database name is in connection string
- [ ] Data exists in Atlas (verified via Compass)
- [ ] Build logs show successful MongoDB connection
- [ ] API endpoints return data (not errors)

---

## 🔧 Common Fixes

### Fix 1: Environment Variables Not Set

**Symptom:** API returns 500 errors or connection failures

**Solution:**
1. Add `MONGODB_URI` in Vercel Dashboard
2. Add `ENCRYPTION_KEY` in Vercel Dashboard
3. **Redeploy** the application

### Fix 2: Network Access Blocked

**Symptom:** Connection timeout errors

**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Add `0.0.0.0/0` (Allow from anywhere)
3. Wait 1-2 minutes
4. Redeploy Vercel

### Fix 3: Wrong Connection String

**Symptom:** Authentication errors or "Invalid scheme"

**Solution:**
1. Copy connection string from Atlas Dashboard
2. Ensure password is URL-encoded
3. Verify database name is included
4. Update in Vercel and redeploy

### Fix 4: Data Not Migrated

**Symptom:** API returns empty arrays `[]`

**Solution:**
1. Verify data in Atlas via Compass
2. If empty, re-run migration:
   ```powershell
   $env:MONGODB_URI_ATLAS="mongodb+srv://admin:Welcome%40123@cluster0.5g85nve.mongodb.net/uniform-distribution?retryWrites=true&w=majority"
   node scripts/migrate-data-to-atlas.js
   ```

---

## 📝 Your Current Configuration

### MongoDB Atlas Connection String:
```
mongodb+srv://admin:Welcome%40123@cluster0.5g85nve.mongodb.net/uniform-distribution?retryWrites=true&w=majority
```

### Encryption Key:
```
default-encryption-key-change-in-production-32-chars!!
```

### Expected Data:
- 40 employees
- 4 companies
- 14 products (uniforms)
- 53 orders
- 3 vendors

---

## 🆘 Still Not Working?

If you've checked all the above and data still isn't showing:

1. **Share Vercel Deployment Logs:**
   - Copy error messages from Build Logs
   - Copy error messages from Function Logs

2. **Test API Endpoint Directly:**
   - Share the response from: `https://your-project.vercel.app/api/products`

3. **Verify Atlas Connection:**
   - Can you connect via MongoDB Compass?
   - Do you see data in Compass?

4. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed API calls

---

## ✅ Success Indicators

When everything is working, you should see:

1. **Vercel Build Logs:**
   ```
   ✅ MongoDB Connected Successfully
   📊 Database: uniform-distribution
   ```

2. **API Response:**
   ```json
   [
     { "id": "...", "name": "...", ... },
     ...
   ]
   ```

3. **Browser:**
   - Superadmin dashboard shows data
   - No console errors
   - API calls return 200 status

---

**Need more help?** Share your Vercel deployment logs and we can diagnose further!

