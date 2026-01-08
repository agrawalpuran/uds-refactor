# Vercel Deployment Checklist

## Pre-Deployment Setup

### ✅ 1. Code Configuration (COMPLETED)

- [x] `vercel.json` configured with serverless settings
- [x] `next.config.js` updated for serverless compatibility
- [x] All 93 API routes have `export const dynamic = 'force-dynamic'`
- [x] Base URL utility created (`lib/utils/base-url.ts`)
- [x] MongoDB connection uses caching (serverless-friendly)

### 2. Environment Variables (TO BE DONE IN VERCEL DASHBOARD)

Add these in **Vercel Dashboard → Settings → Environment Variables**:

#### Required:
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `ENCRYPTION_KEY` - 32-character encryption key

#### Optional:
- [ ] `NEXT_PUBLIC_BASE_URL` - Auto-detected from VERCEL_URL if not set
- [ ] `SHIPROCKET_EMAIL` - If using Shiprocket
- [ ] `SHIPROCKET_PASSWORD` - If using Shiprocket
- [ ] `SENDGRID_API_KEY` - If using SendGrid email
- [ ] `AWS_ACCESS_KEY_ID` - If using AWS SES
- [ ] `AWS_SECRET_ACCESS_KEY` - If using AWS SES
- [ ] `TWILIO_ACCOUNT_SID` - If using WhatsApp
- [ ] `TWILIO_AUTH_TOKEN` - If using WhatsApp

### 3. MongoDB Atlas Configuration

- [ ] **IP Whitelist**: Add `0.0.0.0/0` (allow all IPs) OR add Vercel IP ranges
- [ ] **Database User**: Ensure user has read/write permissions
- [ ] **Connection String**: Test connection string locally before deploying

### 4. Vercel Project Setup

- [ ] Connect GitHub repository to Vercel
- [ ] Select project root directory (should be `/`)
- [ ] Framework: Next.js (auto-detected)
- [ ] Build Command: `npm run build` (default)
- [ ] Output Directory: `.next` (default)
- [ ] Install Command: `npm install` (default)

## Deployment Steps

### Step 1: Initial Deployment

1. Go to: https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project settings
5. Add environment variables (see section 2 above)
6. Click **"Deploy"**

### Step 2: Monitor Build

- [ ] Watch build logs for errors
- [ ] Check for missing dependencies
- [ ] Verify MongoDB connection in logs
- [ ] Note deployment URL

### Step 3: Post-Deployment Verification

#### Basic Checks:
- [ ] Homepage loads without errors
- [ ] No console errors in browser (F12)
- [ ] API routes respond (test `/api/products`)

#### Functional Tests:
- [ ] **Login Flow**: Test all user types (Employee, Company Admin, Vendor, Super Admin)
- [ ] **PR Creation**: Employee can create PR
- [ ] **Location Admin Approval**: PR appears in Location Admin dashboard
- [ ] **Company Admin Approval**: PR appears in Company Admin dashboard
- [ ] **Vendor Visibility**: Vendor can see approved orders
- [ ] **Shipment Creation**: Vendor can create shipments (manual/automatic)
- [ ] **GRN Handling**: GRN workflow functions
- [ ] **Dropdowns**: All dropdowns load data from database
- [ ] **Search/Filter**: Search and filter functions work

#### API Endpoint Tests:
- [ ] `GET /api/products` - Returns products
- [ ] `GET /api/employees?companyId=XXX` - Returns employees
- [ ] `GET /api/orders?companyId=XXX` - Returns orders
- [ ] `POST /api/orders` - Creates order
- [ ] `GET /api/vendor/orders` - Returns vendor orders
- [ ] All other critical API endpoints

## Troubleshooting

### Build Fails

**Check:**
1. Build logs in Vercel dashboard
2. TypeScript errors
3. Missing dependencies in `package.json`
4. Environment variables not set

**Common Issues:**
- Missing `MONGODB_URI` → Add in environment variables
- TypeScript errors → Fix before deploying
- Large bundle size → Check for unnecessary imports

### Runtime Errors

**Check:**
1. Function logs in Vercel dashboard
2. Browser console (F12)
3. Network tab for failed API calls

**Common Issues:**
- MongoDB connection timeout → Check IP whitelist in Atlas
- Missing environment variable → Add in Vercel dashboard
- CORS errors → Already configured in `vercel.json`

### Database Connection Issues

**Symptoms:**
- API returns 500 errors
- "MongoDB connection failed" in logs

**Solutions:**
1. Verify `MONGODB_URI` is correct in Vercel
2. Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for testing)
3. Verify database user has correct permissions
4. Check connection string format (URL-encode special characters)

### API Routes Not Working

**Symptoms:**
- 404 errors on API routes
- Routes return empty responses

**Solutions:**
1. Verify `export const dynamic = 'force-dynamic'` in route files
2. Check function logs in Vercel dashboard
3. Verify route file structure matches Next.js App Router format
4. Check for runtime errors in function logs

## Performance Optimization

### Serverless Function Limits

- **Timeout**: 30 seconds (configured in `vercel.json`)
- **Memory**: Default (can be increased in Vercel dashboard)
- **Cold Starts**: First request may be slower (normal for serverless)

### Database Connection

- ✅ Connection is cached per function instance
- ✅ Uses connection pooling
- ✅ Lazy connection (connects on first request)

### Monitoring

- Enable Vercel Analytics (optional)
- Monitor function execution times
- Check error rates in Vercel dashboard

## Post-Deployment

### 1. Update Documentation

- [ ] Update any hardcoded URLs in documentation
- [ ] Share deployment URL with team
- [ ] Update webhook URLs (Twilio, etc.) if needed

### 2. Security Checklist

- [ ] All sensitive data in environment variables (not hardcoded)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Encryption keys are secure
- [ ] API keys are not exposed in client-side code

### 3. Continuous Deployment

- [ ] Verify auto-deployment from GitHub works
- [ ] Test preview deployments for PRs
- [ ] Set up deployment notifications (optional)

## Success Criteria

✅ **Deployment is successful when:**
1. Build completes without errors
2. All pages load correctly
3. All API routes respond
4. Database connections work
5. Login/logout flows work
6. All workflows (PR, PO, Shipment) function
7. No console errors in browser
8. Application behaves identically to localhost

## Quick Test URLs

After deployment, test these URLs:

```
https://your-app.vercel.app/
https://your-app.vercel.app/api/products
https://your-app.vercel.app/api/employees?companyId=100001
https://your-app.vercel.app/login/company
https://your-app.vercel.app/login/vendor
https://your-app.vercel.app/login/superadmin
```

## Support

If deployment fails:
1. Check Vercel build logs
2. Check function logs for runtime errors
3. Verify all environment variables are set
4. Test MongoDB connection separately
5. Review this checklist for missed steps

