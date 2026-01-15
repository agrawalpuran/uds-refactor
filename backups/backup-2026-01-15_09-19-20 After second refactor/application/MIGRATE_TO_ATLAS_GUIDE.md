# 📦 Complete Guide: Migrate Local MongoDB to Atlas & Link with Vercel

This guide will help you transfer all your data from MongoDB Compass (local) to MongoDB Atlas, then connect it to Vercel.

---

## 🎯 Overview

**What we'll do:**
1. ✅ Set up MongoDB Atlas (if not already done)
2. ✅ Get your Atlas connection string
3. ✅ Configure network access for Vercel
4. ✅ Migrate all data from local MongoDB to Atlas
5. ✅ Verify the migration
6. ✅ Link Atlas with Vercel

---

## 📋 Prerequisites

- ✅ Local MongoDB running (via MongoDB Compass or MongoDB service)
- ✅ MongoDB Atlas account (free tier works)
- ✅ Your local database: `uniform-distribution`
- ✅ Vercel project already linked to GitHub

---

## 🌐 Step 1: Set Up MongoDB Atlas

### Option A: If You Already Have Atlas Cluster

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Log in to your account
3. Find your existing cluster (e.g., `cluster0.owr3ooi`)
4. Skip to **Step 2**

### Option B: Create New Atlas Cluster

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com/
   - Sign in or create a free account

2. **Create a Free Cluster:**
   - Click **"Build a Database"** or **"Create"**
   - Choose **FREE (M0) Shared** tier
   - Select a region close to you (e.g., `Mumbai (ap-south-1)`)
   - Click **"Create"** (takes 3-5 minutes)

3. **Create Database User:**
   - Go to **Database Access** (left sidebar)
   - Click **"Add New Database User"**
   - Choose **"Password"** authentication
   - Username: `uniform-admin` (or your preferred username)
   - Password: Generate a strong password (save it!)
   - Database User Privileges: **Atlas admin**
   - Click **"Add User"**

4. **Configure Network Access:**
   - Go to **Network Access** (left sidebar)
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - Click **"Confirm"**
   - ⚠️ **Important:** This allows Vercel to connect to your database

---

## 🔗 Step 2: Get Your Atlas Connection String

1. **In MongoDB Atlas Dashboard:**
   - Go to your cluster
   - Click **"Connect"** button

2. **Choose Connection Method:**
   - Select **"Connect your application"**

3. **Copy Connection String:**
   - Choose **"Node.js"** driver
   - Copy the connection string (looks like):
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

4. **Modify Connection String:**
   - Replace `<username>` with your database username (e.g., `uniform-admin`)
   - Replace `<password>` with your database password
   - **Important:** If your password contains special characters, URL-encode them:
     - `$` → `%24`
     - `@` → `%40`
     - `#` → `%23`
     - `%` → `%25`
   - Add database name: Insert `/uniform-distribution` before `?`
   - **Final format:**
     ```
     mongodb+srv://uniform-admin:YourPassword%24@cluster0.xxxxx.mongodb.net/uniform-distribution?retryWrites=true&w=majority
     ```

5. **Save Your Connection String:**
   - Copy it to a safe place (you'll need it for migration and Vercel)

---

## ✅ Step 3: Test Atlas Connection

Before migrating, let's verify Atlas is accessible:

```powershell
# Set your Atlas connection string
$env:MONGODB_URI="mongodb+srv://uniform-admin:YourPassword@cluster0.xxxxx.mongodb.net/uniform-distribution?retryWrites=true&w=majority"

# Test connection
node scripts/test-mongodb-connection.js
```

**Expected output:**
```
✅ Connected to MongoDB
✅ Database: uniform-distribution
✅ Collections found: X
```

If you see errors, check:
- Network access is set to `0.0.0.0/0`
- Username and password are correct
- Connection string format is correct

---

## 🚀 Step 4: Migrate Data to Atlas

### Method A: Using Automated Migration Script (Recommended)

This script will automatically copy all collections from your local MongoDB to Atlas.

1. **Ensure Local MongoDB is Running:**
   - Open MongoDB Compass
   - Verify you can connect to: `mongodb://localhost:27017/uniform-distribution`

2. **Run Migration Script:**
   ```powershell
   # Set your Atlas connection string
   $env:MONGODB_URI_ATLAS="mongodb+srv://uniform-admin:YourPassword@cluster0.xxxxx.mongodb.net/uniform-distribution?retryWrites=true&w=majority"
   
   # Run migration
   node scripts/migrate-data-to-atlas.js
   ```

3. **Watch the Migration:**
   - The script will:
     - Connect to local MongoDB
     - Connect to Atlas
     - List all collections
     - Migrate each collection
     - Show progress for each collection
     - Display final summary

4. **Expected Output:**
   ```
   🚀 Starting data migration to MongoDB Atlas...
   📡 Connecting to local database...
   ✅ Connected to local database
   📡 Connecting to MongoDB Atlas...
   ✅ Connected to MongoDB Atlas
   📁 Found X collections to migrate:
      1. companies
      2. employees
      3. uniforms
      ...
   📦 Migrating companies...
      ✅ Migrated 3 documents
   📦 Migrating employees...
      ✅ Migrated 10 documents
   ...
   🎉 Migration completed successfully!
   ✅ Total documents migrated: XXX
   ```

### Method B: Using MongoDB Compass (Manual/GUI)

If you prefer a visual approach:

1. **Export from Local MongoDB:**
   - Open MongoDB Compass
   - Connect to: `mongodb://localhost:27017/uniform-distribution`
   - For each collection:
     - Right-click collection → **"Export Collection"**
     - Choose **JSON** format
     - Save to a folder (e.g., `C:\mongodb-export\`)

2. **Import to Atlas:**
   - In MongoDB Compass, click **"New Connection"**
   - Paste your Atlas connection string
   - Click **"Connect"**
   - For each exported JSON file:
     - Right-click database → **"Import Collection"**
     - Select the JSON file
     - Click **"Import"**

---

## ✅ Step 5: Verify Migration

1. **Check Data in Atlas via Compass:**
   - Connect MongoDB Compass to your Atlas connection string
   - Browse collections
   - Verify document counts match your local database

2. **Or Use Verification Script:**
   ```powershell
   # Set Atlas connection string
   $env:MONGODB_URI="mongodb+srv://uniform-admin:YourPassword@cluster0.xxxxx.mongodb.net/uniform-distribution?retryWrites=true&w=majority"
   
   # Test connection and view collections
   node scripts/test-mongodb-connection.js
   ```

3. **Verify Key Collections:**
   - Check these collections have data:
     - `companies`
     - `employees`
     - `uniforms`
     - `vendors`
     - `orders`
     - `companyadmins`

---

## 🔗 Step 6: Link Atlas with Vercel

Now that your data is in Atlas, connect it to Vercel:

### 6.1: Add Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project (`uds-new`)

2. **Navigate to Environment Variables:**
   - Go to **Settings** → **Environment Variables**

3. **Add MONGODB_URI:**
   - Click **"Add New"**
   - **Key:** `MONGODB_URI`
   - **Value:** Your Atlas connection string:
     ```
     mongodb+srv://uniform-admin:YourPassword@cluster0.xxxxx.mongodb.net/uniform-distribution?retryWrites=true&w=majority
     ```
   - **Environments:** Select all (☑ Production, ☑ Preview, ☑ Development)
   - Click **"Save"**

4. **Add ENCRYPTION_KEY:**
   - Click **"Add New"**
   - **Key:** `ENCRYPTION_KEY`
   - **Value:** `default-encryption-key-change-in-production-32-chars!!`
   - **Environments:** Select all (☑ Production, ☑ Preview, ☑ Development)
   - Click **"Save"**

5. **Add NODE_ENV (Optional):**
   - Click **"Add New"**
   - **Key:** `NODE_ENV`
   - **Value:** `production`
   - **Environments:** ☑ Production only
   - Click **"Save"**

### 6.2: Redeploy Application

After adding environment variables, redeploy:

1. **Go to Deployments Tab:**
   - In Vercel Dashboard → Your Project → **Deployments**

2. **Redeploy:**
   - Click the **three dots (⋯)** on the latest deployment
   - Click **"Redeploy"**
   - Wait for build to complete (2-5 minutes)

### 6.3: Verify Connection

1. **Check Deployment Logs:**
   - Open the deployment
   - View **"Build Logs"** and **"Function Logs"**
   - Look for: `✅ MongoDB Connected` or connection errors

2. **Test Application:**
   - Visit your Vercel URL: `https://your-project-name.vercel.app`
   - Try logging in
   - Verify data loads from Atlas

---

## 🔍 Step 7: Final Verification

### Test Local vs Atlas Data

1. **Compare Collection Counts:**
   ```powershell
   # Test local
   $env:MONGODB_URI="mongodb://localhost:27017/uniform-distribution"
   node scripts/test-mongodb-connection.js
   
   # Test Atlas
   $env:MONGODB_URI="mongodb+srv://uniform-admin:YourPassword@cluster0.xxxxx.mongodb.net/uniform-distribution?retryWrites=true&w=majority"
   node scripts/test-mongodb-connection.js
   ```

2. **Verify in MongoDB Compass:**
   - Connect to both local and Atlas
   - Compare document counts for each collection
   - Spot-check a few documents to ensure data integrity

---

## 🚨 Troubleshooting

### Migration Fails

**Error: "Cannot connect to local MongoDB"**
- ✅ Ensure MongoDB service is running
- ✅ Check connection string: `mongodb://localhost:27017/uniform-distribution`
- ✅ Verify database name is correct

**Error: "Cannot connect to Atlas"**
- ✅ Check network access in Atlas (should include `0.0.0.0/0`)
- ✅ Verify username and password are correct
- ✅ Check connection string format (URL-encode special characters)
- ✅ Ensure cluster is running (not paused)

**Error: "Authentication failed"**
- ✅ Verify database user exists in Atlas
- ✅ Check password is correct (URL-encoded if needed)
- ✅ Ensure user has proper privileges

### Vercel Connection Fails

**Error: "MongoDB connection failed"**
- ✅ Verify `MONGODB_URI` is set in Vercel environment variables
- ✅ Check network access in Atlas includes `0.0.0.0/0`
- ✅ Ensure you redeployed after adding environment variables
- ✅ Check Vercel deployment logs for specific errors

**Error: "Environment variable not found"**
- ✅ Ensure variables are set for correct environment (Production/Preview/Development)
- ✅ Check variable names match exactly (case-sensitive)
- ✅ Redeploy after adding variables

---

## 📝 Quick Reference Commands

```powershell
# Test local MongoDB
$env:MONGODB_URI="mongodb://localhost:27017/uniform-distribution"
node scripts/test-mongodb-connection.js

# Test Atlas connection
$env:MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/uniform-distribution?retryWrites=true&w=majority"
node scripts/test-mongodb-connection.js

# Migrate to Atlas
$env:MONGODB_URI_ATLAS="mongodb+srv://user:pass@cluster.mongodb.net/uniform-distribution?retryWrites=true&w=majority"
node scripts/migrate-data-to-atlas.js
```

---

## ✅ Success Checklist

- [ ] MongoDB Atlas cluster created/verified
- [ ] Database user created with admin privileges
- [ ] Network access configured (`0.0.0.0/0`)
- [ ] Atlas connection string obtained and tested
- [ ] Data migrated from local to Atlas
- [ ] Migration verified (collection counts match)
- [ ] Environment variables added in Vercel
- [ ] Application redeployed
- [ ] Vercel deployment connects to Atlas successfully
- [ ] Application tested and working

---

## 🎉 You're Done!

Your data is now in MongoDB Atlas and connected to Vercel! 

**Next Steps:**
- Monitor Vercel deployments
- Test all application features
- Consider setting up automated backups in Atlas
- Update local `.env.local` to use Atlas for development (optional)

---

## 📚 Related Documentation

- `VERCEL_ENVIRONMENT_VARIABLES.md` - Full environment variables guide
- `MONGODB_CONNECTION_SETUP.md` - MongoDB setup details
- `VERCEL_DEPLOYMENT_GUIDE.md` - Complete deployment guide

---

**Need Help?**
- Check Vercel deployment logs
- Review MongoDB Atlas connection logs
- Verify environment variables are set correctly
- Test connections using the scripts provided

