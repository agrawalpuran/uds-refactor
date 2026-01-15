# ✅ Vercel Environment Variables Setup Checklist

## Why You Don't See MongoDB Connection Logs

If you don't see MongoDB connection logs in Vercel build logs, it means:

1. **Environment variable `MONGODB_URI` is NOT set** in Vercel
2. **The connection is never attempted** because the variable is missing
3. **API routes fail silently** or return empty data

---

## 🔧 Step-by-Step Fix

### Step 1: Add Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project (`uds-new`)

2. **Navigate to Environment Variables:**
   - Click **Settings** (top menu)
   - Click **Environment Variables** (left sidebar)

3. **Add MONGODB_URI:**
   - Click **"Add New"** button
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

4. **Add ENCRYPTION_KEY:**
   - Click **"Add New"** button again
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

### Step 2: REDEPLOY (Critical!)

**⚠️ IMPORTANT:** Environment variables only take effect after redeployment!

1. **Go to Deployments Tab:**
   - Click **Deployments** (top menu)

2. **Redeploy Latest:**
   - Find your latest deployment
   - Click **⋯** (three dots) on the right
   - Click **"Redeploy"**
   - Click **"Redeploy"** again to confirm

3. **Wait for Build:**
   - Build takes 2-5 minutes
   - Watch the build logs

### Step 3: Check Build Logs

After redeployment, check logs for:

**✅ Success Indicators:**
```
🔌 Attempting MongoDB connection...
📍 URI: mongodb+srv://admin:***@cluster0.5g85nve.mongodb.net/...
✅ MongoDB Connected Successfully
📊 Database: uniform-distribution
```

**❌ Error Indicators:**
```
❌ MongoDB Connection Failed
   Error: [error message]
```

### Step 4: Check Function Logs

Build logs show build-time info. For runtime connection attempts:

1. **Go to Deployments** → Click on a deployment
2. **Click "Functions" tab**
3. **Click on an API route** (e.g., `/api/products`)
4. **View "Logs"** - This shows runtime connection attempts

---

## 🔍 Verification Steps

### Test 1: Check Environment Variables Are Set

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify you see:
   - `MONGODB_URI` ✅
   - `ENCRYPTION_KEY` ✅

### Test 2: Test API Endpoint

Visit in browser:
```
https://your-project.vercel.app/api/products
```

**Expected:**
- JSON array with product data
- Status 200

**If Empty Array `[]`:**
- Data might not be in Atlas
- Check MongoDB Compass

**If Error:**
- Check error message
- Check Function Logs in Vercel

### Test 3: Check MongoDB Atlas Network Access

1. Go to: https://cloud.mongodb.com/
2. Click **Network Access**
3. Verify `0.0.0.0/0` is in the list
4. If missing, add it and wait 1-2 minutes

---

## 📝 Your Configuration Values

### MONGODB_URI:
```
mongodb+srv://admin:Welcome%40123@cluster0.5g85nve.mongodb.net/uniform-distribution?retryWrites=true&w=majority
```

**Important Notes:**
- Password is URL-encoded: `Welcome%40123` (not `Welcome@123`)
- Database name is included: `/uniform-distribution`
- Cluster: `cluster0.5g85nve.mongodb.net`

### ENCRYPTION_KEY:
```
default-encryption-key-change-in-production-32-chars!!
```

---

## 🚨 Common Mistakes

### Mistake 1: Forgot to Redeploy
**Symptom:** Variables added but no connection logs
**Fix:** Must redeploy after adding variables

### Mistake 2: Wrong Environment Scope
**Symptom:** Variables set but only for Development, not Production
**Fix:** Set for Production environment

### Mistake 3: Password Not URL-Encoded
**Symptom:** Authentication errors
**Fix:** Use `Welcome%40123` not `Welcome@123`

### Mistake 4: Missing Database Name
**Symptom:** Connects but no data
**Fix:** Include `/uniform-distribution` in connection string

### Mistake 5: Network Access Blocked
**Symptom:** Connection timeout
**Fix:** Add `0.0.0.0/0` to Atlas Network Access

---

## ✅ Success Checklist

After following all steps, you should see:

- [ ] Environment variables set in Vercel Dashboard
- [ ] Variables set for Production environment
- [ ] Application redeployed after adding variables
- [ ] Build logs show "✅ MongoDB Connected Successfully"
- [ ] Function logs show connection attempts
- [ ] API endpoints return data (not empty arrays)
- [ ] Network access allows `0.0.0.0/0` in Atlas

---

## 🆘 Still Not Working?

If you've completed all steps and still don't see connection logs:

1. **Share Vercel Project URL:**
   - So we can check the deployment

2. **Share Build Logs:**
   - Copy the entire build log output
   - Look for any errors or warnings

3. **Share Function Logs:**
   - Go to Deployments → Functions → Click an API route → Logs
   - Copy any error messages

4. **Test API Endpoint:**
   - Visit: `https://your-project.vercel.app/api/products`
   - Share the response (or screenshot)

---

**Remember:** Environment variables only work after redeployment! 🚀

