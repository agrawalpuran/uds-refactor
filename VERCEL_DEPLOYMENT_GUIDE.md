# 🚀 Vercel Deployment Guide for UDS

Complete guide to deploy the Uniform Distribution System (UDS) to Vercel with MongoDB Atlas database.

## 📋 Prerequisites

1. **GitHub Account** - Code is already pushed to: https://github.com/agrawalpuran/UDS
2. **Vercel Account** - Sign up at https://vercel.com (free tier available)
3. **MongoDB Atlas Account** - Database is already set up

---

## 🗄️ Step 1: MongoDB Atlas Database Setup

### Current Database Configuration

Your MongoDB Atlas database is already configured:
- **Connection String:** `mongodb+srv://admin:Welcome%24123@cluster0.owr3ooi.mongodb.net/uniform-distribution?retryWrites=true&w=majority`
- **Database Name:** `uniform-distribution`
- **Note:** Password is URL-encoded (`$` → `%24`)

### Verify Database Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in with your credentials
3. Navigate to your cluster: `cluster0.owr3ooi`
4. Click **"Connect"** → **"Connect your application"**
5. Copy the connection string (you already have it)

### Network Access (Important!)

Ensure your MongoDB Atlas cluster allows connections from:
- **Vercel IPs:** Add `0.0.0.0/0` (allow all IPs) for Vercel deployments
- Go to **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (for Vercel)

---

## 🔧 Step 2: Deploy to Vercel

### Option A: Import from GitHub (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com
   - Sign in with your GitHub account

2. **Import Project:**
   - Click **"Add New..."** → **"Project"**
   - Select **"Import Git Repository"**
   - Find and select: `agrawalpuran/UDS`
   - Click **"Import"**

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables:**
   Add the following environment variables in Vercel:

   ```
   MONGODB_URI=mongodb+srv://admin:Welcome%24123@cluster0.owr3ooi.mongodb.net/uniform-distribution?retryWrites=true&w=majority
   ENCRYPTION_KEY=default-encryption-key-change-in-production-32-chars!!
   NODE_ENV=production
   ```

   **How to add:**
   - In the project settings, go to **"Environment Variables"**
   - Add each variable:
     - **Key:** `MONGODB_URI`
     - **Value:** `mongodb+srv://admin:Welcome%24123@cluster0.owr3ooi.mongodb.net/uniform-distribution?retryWrites=true&w=majority`
     - **Environment:** Select all (Production, Preview, Development)
   - Repeat for `ENCRYPTION_KEY` and `NODE_ENV`

5. **Deploy:**
   - Click **"Deploy"**
   - Wait for the build to complete (2-5 minutes)

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```powershell
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```powershell
   vercel login
   ```

3. **Deploy:**
   ```powershell
   cd "C:\Users\pagrawal\OneDrive - CSG Systems Inc\Personal\Cursor AI\uniform-distribution-system"
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project or create new
   - Set environment variables when prompted

---

## 🔐 Step 3: Environment Variables Configuration

### Required Environment Variables

Add these in **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

| Variable | Value | Environment |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://admin:Welcome%24123@cluster0.owr3ooi.mongodb.net/uniform-distribution?retryWrites=true&w=majority` | All |
| `ENCRYPTION_KEY` | `default-encryption-key-change-in-production-32-chars!!` | All |
| `NODE_ENV` | `production` | Production |

### Optional Environment Variables

If you're using WhatsApp/Twilio integration:

| Variable | Description | Required |
|----------|-------------|----------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | No |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | No |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number | No |
| `WHATSAPP_WEBHOOK_URL` | WhatsApp Webhook URL | No |

---

## 🌐 Step 4: Access Your Application

### After Deployment

1. **Vercel will provide you with:**
   - **Production URL:** `https://your-project-name.vercel.app`
   - **Preview URLs:** For each branch/PR

2. **Access the Application:**
   - Open the production URL in your browser
   - The application should load and connect to MongoDB Atlas

3. **Test Login:**
   - Try logging in with existing credentials
   - Example: `rajesh.kumar@goindigo.in` (if exists in database)

---

## 🔄 Step 5: Auto-Deployment Setup

### Enable Auto-Deploy

1. **Go to Project Settings:**
   - Vercel Dashboard → Your Project → **Settings**

2. **Git Integration:**
   - Ensure **"Git Integration"** is connected to `agrawalpuran/UDS`
   - **Production Branch:** `master`

3. **Auto-Deploy:**
   - Every push to `master` branch will automatically deploy
   - Preview deployments for pull requests

---

## 📊 Step 6: Verify Deployment

### Check Deployment Status

1. **Vercel Dashboard:**
   - Go to your project
   - Check **"Deployments"** tab
   - Ensure latest deployment shows **"Ready"** status

2. **Test Application:**
   - Visit your production URL
   - Test login functionality
   - Verify database connection

3. **Check Logs:**
   - Go to **"Deployments"** → Click on a deployment
   - View **"Build Logs"** and **"Function Logs"** for any errors

### Common Issues & Solutions

#### Issue: Database Connection Failed
**Solution:**
- Verify `MONGODB_URI` is correctly set in Vercel
- Check MongoDB Atlas Network Access allows `0.0.0.0/0`
- Ensure password is URL-encoded (`$` → `%24`)

#### Issue: Build Fails
**Solution:**
- Check build logs in Vercel
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18.x by default)

#### Issue: Environment Variables Not Working
**Solution:**
- Redeploy after adding environment variables
- Ensure variables are set for correct environment (Production/Preview/Development)
- Check variable names match exactly (case-sensitive)

---

## 🔗 Important Links

- **GitHub Repository:** https://github.com/agrawalpuran/UDS
- **Vercel Dashboard:** https://vercel.com/dashboard
- **MongoDB Atlas:** https://cloud.mongodb.com/
- **Vercel Documentation:** https://vercel.com/docs

---

## 📝 Next Steps

1. ✅ **Deploy to Vercel** (follow Step 2)
2. ✅ **Configure Environment Variables** (follow Step 3)
3. ✅ **Test Application** (follow Step 6)
4. ✅ **Set up Custom Domain** (optional, in Vercel Settings)
5. ✅ **Monitor Deployments** (check Vercel Dashboard regularly)

---

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify MongoDB Atlas connection
3. Review environment variables
4. Check GitHub repository for latest code

---

## 🎉 Success!

Once deployed, your application will be accessible at:
- **Production:** `https://your-project-name.vercel.app`
- **Automatic HTTPS:** Enabled by default
- **Global CDN:** Fast access worldwide
- **Auto-scaling:** Handles traffic automatically

**Your UDS application is now live on Vercel!** 🚀
