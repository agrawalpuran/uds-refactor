# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables in **Vercel Dashboard → Project Settings → Environment Variables**:

### Database

| Variable | Value | Environments | Description |
|----------|-------|--------------|-------------|
| `MONGODB_URI` | `mongodb+srv://admin:Welcome$123@cluster0.owr3ooi.mongodb.net/uniform-distribution?retryWrites=true&w=majority` | ☑ Production ☑ Preview ☑ Development | MongoDB Atlas connection string |

### Security & Encryption

| Variable | Value | Environments | Description |
|----------|-------|--------------|-------------|
| `ENCRYPTION_KEY` | `default-encryption-key-change-in-production-32-chars!!` | ☑ Production ☑ Preview ☑ Development | AES-256 encryption key (32 characters) |

### Application Configuration

| Variable | Value | Environments | Description |
|----------|-------|--------------|-------------|
| `NODE_ENV` | `production` | ☑ Production | Node environment |
| `NEXT_PUBLIC_BASE_URL` | `https://your-project-name.vercel.app` | ☑ Production | Public base URL (optional, auto-detected from VERCEL_URL) |

### Optional: Shipping Providers

| Variable | Value | Environments | Description |
|----------|-------|--------------|-------------|
| `SHIPROCKET_EMAIL` | Your Shiprocket email | ☑ Production | Shiprocket API credentials |
| `SHIPROCKET_PASSWORD` | Your Shiprocket password | ☑ Production | Shiprocket API credentials |

### Optional: Email Providers

| Variable | Value | Environments | Description |
|----------|-------|--------------|-------------|
| `SENDGRID_API_KEY` | Your SendGrid API key | ☑ Production | SendGrid email provider |
| `AWS_ACCESS_KEY_ID` | Your AWS access key | ☑ Production | AWS SES email provider |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | ☑ Production | AWS SES email provider |
| `AWS_REGION` | `ap-south-1` or `us-east-1` | ☑ Production | AWS region for SES |

### Optional: WhatsApp/Twilio

| Variable | Value | Environments | Description |
|----------|-------|--------------|-------------|
| `TWILIO_ACCOUNT_SID` | Your Twilio SID | ☑ Production | Twilio WhatsApp integration |
| `TWILIO_AUTH_TOKEN` | Your Twilio token | ☑ Production | Twilio WhatsApp integration |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` | ☑ Production | Twilio WhatsApp number |

## How to Add in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter variable name and value
6. Select environments (Production, Preview, Development)
7. Click **Save**

## Important Notes

- **MONGODB_URI**: Must be your MongoDB Atlas connection string (not localhost)
- **ENCRYPTION_KEY**: Must match the key used to encrypt existing data
- **NEXT_PUBLIC_BASE_URL**: Optional - Vercel auto-provides `VERCEL_URL`
- All sensitive values are encrypted by Vercel
- Variables are available at build time and runtime

## Verification

After adding variables, redeploy your application:

1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Check build logs for any missing variable errors

## Testing Locally

Create `.env.local` file with the same variables for local testing:

```env
MONGODB_URI=mongodb+srv://admin:Welcome$123@cluster0.owr3ooi.mongodb.net/uniform-distribution?retryWrites=true&w=majority
ENCRYPTION_KEY=default-encryption-key-change-in-production-32-chars!!
NODE_ENV=development
```

