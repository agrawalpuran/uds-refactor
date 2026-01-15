# 🔧 Fix: Vercel MongoDB Connection Error

## Error You're Seeing

```
❌ MongoDB Connection Failed:
Error: connect ECONNREFUSED 127.0.0.1:27017
```

## Root Cause

The application is trying to connect to **localhost MongoDB** (`127.0.0.1:27017`) instead of **MongoDB Atlas**.

This happens because the `MONGODB_URI` environment variable is **NOT set in Vercel**, so it falls back to the default local connection string.

---

## ✅ Solution: Add Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your project (`uds-new`)

### Step 2: Add Environment Variables

1. Click **Settings** (top menu)
2. Click **Environment Variables** (left sidebar)
3. Click **"Add New"** button

#### Add Variable 1: MONGODB_URI

- **Key:** `MONGODB_URI`
- **Value:** 
  ```
  mongodb+srv://admin:Welcome%40123@cluster0.5g85nve.mongodb.net/uniform-distribution?retryWrites=true&w=majority
  ```
- **Environments:** 
  - ☑ Production
  - ☑ Preview
  - ☑ Development
- Click **"Save"**

#### Add Variable 2: ENCRYPTION_KEY

- Click **"Add New"** again
- **Key:** `ENCRYPTION_KEY`
- **Value:** 
  ```
  default-encryption-key-change-in-production-32-chars!!
  ```
- **Environments:** 
  - ☑ Production
  - ☑ Preview
  - ☑ Development
- Click **"Save"**

### Step 3: REDEPLOY (Critical!)

**⚠️ IMPORTANT:** Environment variables only take effect after redeployment!

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click **⋯** (three dots) on the right
4. Click **"Redeploy"**
5. Click **"Redeploy"** again to confirm
6. Wait 2-5 minutes for build to complete

### Step 4: Verify Fix

After redeployment, check the logs:

1. Go to **Deployments** → Click on the new deployment
2. Check **Build Logs** - should show successful build
3. Check **Function Logs** - should show:
   ```
   🔌 Attempting MongoDB connection...
   ✅ MongoDB Connected Successfully
   📊 Database: uniform-distribution
   ```

4. Test API endpoint:
   - Visit: `https://your-project.vercel.app/api/products`
   - Should return JSON data (not empty array)

---

## 📝 Exact Values to Copy-Paste

### MONGODB_URI:
```
mongodb+srv://admin:Welcome%40123@cluster0.5g85nve.mongodb.net/uniform-distribution?retryWrites=true&w=majority
```

**Important:**
- Password is URL-encoded: `Welcome%40123` (the `@` is encoded as `%40`)
- Database name is included: `/uniform-distribution`
- Don't add quotes around the value

### ENCRYPTION_KEY:
```
default-encryption-key-change-in-production-32-chars!!
```

---

## 🔍 Why This Happens

The code has a fallback:
```typescript
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uniform-distribution'
```

When `MONGODB_URI` is not set in Vercel:
- `process.env.MONGODB_URI` is `undefined`
- Falls back to: `mongodb://localhost:27017/uniform-distribution`
- Tries to connect to localhost → **Connection Refused Error**

---

## ✅ After Fixing

You should see:
- ✅ No more `ECONNREFUSED 127.0.0.1:27017` errors
- ✅ Connection logs showing Atlas connection
- ✅ API endpoints returning data
- ✅ Superadmin dashboard showing data

---

## 🚨 Still Getting Errors?

If you still see errors after adding variables and redeploying:

1. **Double-check variable names:**
   - Must be exactly: `MONGODB_URI` (case-sensitive)
   - Must be exactly: `ENCRYPTION_KEY` (case-sensitive)

2. **Verify you redeployed:**
   - Check deployment timestamp
   - Should be after you added the variables

3. **Check Function Logs:**
   - Go to Deployments → Functions → Click an API route → Logs
   - Look for specific error messages

4. **Verify MongoDB Atlas Network Access:**
   - Go to MongoDB Atlas → Network Access
   - Ensure `0.0.0.0/0` is in the whitelist

---

**The fix is simple: Add the environment variables and redeploy!** 🚀

