# Email Provider Adapters - Setup Guide

## Overview

This guide explains how to set up and use email provider adapters in the UDS Email Notification System. The adapter system follows the same pattern as the logistics provider system for consistency.

## Architecture

```
┌─────────────────────────┐
│ NotificationSenderProfile│ (Stores provider config)
└───────────┬─────────────┘
            │
            │
┌───────────▼─────────────┐
│ EmailProviderFactory    │ (Creates provider instances)
└───────────┬─────────────┘
            │
            ├──────────────┬──────────────┬──────────────┐
            │              │              │              │
┌───────────▼──────┐ ┌─────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
│ SMTPProvider    │ │SendGrid     │ │SESProvider│ │Mailgun    │
│                 │ │Provider     │ │           │ │Provider   │
└─────────────────┘ └─────────────┘ └───────────┘ └───────────┘
```

## Supported Providers

1. **SMTP** - Standard SMTP servers (Gmail, Outlook, custom SMTP)
2. **SendGrid** - SendGrid API v3
3. **SES** - AWS Simple Email Service
4. **Mailgun** - (Placeholder, to be implemented)

## Setup Instructions

### 1. Create NotificationSenderProfile

First, create a sender profile in the database with provider configuration:

```typescript
import NotificationSenderProfile from '@/lib/models/NotificationSenderProfile'
import { encrypt } from '@/lib/utils/encryption'

// Example: SMTP Provider
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password', // Use app password for Gmail
  },
  tls: {
    rejectUnauthorized: false,
  },
}

// Encrypt the configuration
const encryptedConfig = encrypt(JSON.stringify(smtpConfig))

// Create sender profile
const senderProfile = await NotificationSenderProfile.create({
  senderId: '800001',
  companyId: companyObjectId,
  senderName: 'UDS Support',
  senderEmail: 'noreply@uds.com',
  replyToEmail: 'support@uds.com',
  useDefaultProvider: false,
  providerType: 'SMTP',
  providerConfig: encryptedConfig,
  isActive: true,
})
```

### 2. SendGrid Setup

```typescript
// SendGrid Configuration
const sendGridConfig = {
  apiKey: 'SG.your-api-key-here',
}

const encryptedConfig = encrypt(JSON.stringify(sendGridConfig))

const senderProfile = await NotificationSenderProfile.create({
  senderId: '800002',
  companyId: companyObjectId,
  senderName: 'UDS Support',
  senderEmail: 'noreply@yourdomain.com', // Must be verified in SendGrid
  replyToEmail: 'support@yourdomain.com',
  useDefaultProvider: false,
  providerType: 'SENDGRID',
  providerConfig: encryptedConfig,
  isActive: true,
})
```

### 3. AWS SES Setup

```typescript
// AWS SES Configuration
const sesConfig = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'us-east-1', // or 'ap-south-1' for India
}

const encryptedConfig = encrypt(JSON.stringify(sesConfig))

const senderProfile = await NotificationSenderProfile.create({
  senderId: '800003',
  companyId: companyObjectId,
  senderName: 'UDS Support',
  senderEmail: 'noreply@yourdomain.com', // Must be verified in SES
  replyToEmail: 'support@yourdomain.com',
  useDefaultProvider: false,
  providerType: 'SES',
  providerConfig: encryptedConfig,
  isActive: true,
})
```

## Usage Examples

### Example 1: Send Email Using Sender Profile

```typescript
import { createEmailProvider } from '@/lib/providers/email/EmailProviderFactory'
import { EmailProvider } from '@/lib/providers/email/EmailProvider'

// Get provider from sender profile
const provider = await createEmailProvider('800001') // senderId

if (provider) {
  const result = await provider.sendEmail({
    to: 'employee@example.com',
    subject: 'Your PR has been approved',
    body: '<h1>Hello</h1><p>Your PR PR-12345 has been approved.</p>',
    fromEmail: 'noreply@uds.com',
    fromName: 'UDS Support',
    replyTo: 'support@uds.com',
  })

  if (result.success) {
    console.log('Email sent:', result.messageId)
  } else {
    console.error('Email failed:', result.error)
  }
}
```

### Example 2: Direct Provider Usage (Testing)

```typescript
import { createEmailProviderWithConfig } from '@/lib/providers/email/EmailProviderFactory'
import { SMTPProvider } from '@/lib/providers/email/SMTPProvider'

// For testing/development - use direct config
const provider = await createEmailProviderWithConfig('SMTP', {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'test@gmail.com',
    pass: 'app-password',
  },
  fromEmail: 'test@gmail.com',
  fromName: 'Test Sender',
})

const result = await provider.sendEmail({
  to: 'recipient@example.com',
  subject: 'Test Email',
  body: '<p>This is a test email.</p>',
  fromEmail: 'test@gmail.com',
})
```

### Example 3: Health Check

```typescript
const provider = await createEmailProvider('800001')

if (provider) {
  const health = await provider.healthCheck()
  if (health.success) {
    console.log('Provider is healthy:', health.message)
  } else {
    console.error('Provider health check failed:', health.error)
  }
}
```

## Provider-Specific Notes

### SMTP Provider

- **Gmail**: Requires app password (not regular password)
  - Enable 2FA
  - Generate app password: https://myaccount.google.com/apppasswords
- **Outlook/Hotmail**: Use SMTP settings
  - Host: `smtp-mail.outlook.com`
  - Port: `587`
  - Secure: `false`
- **Custom SMTP**: Configure based on your server settings

### SendGrid Provider

- **API Key**: Get from SendGrid dashboard
- **Sender Verification**: Must verify sender email in SendGrid
- **Rate Limits**: Check SendGrid plan limits
- **Webhooks**: Set up webhooks for delivery tracking

### AWS SES Provider

- **Credentials**: Use IAM user with SES permissions
- **Region**: Choose closest region (e.g., `ap-south-1` for India)
- **Sender Verification**: Must verify sender email/domain in SES
- **Sandbox Mode**: New SES accounts start in sandbox (limited to verified emails)
- **Production Access**: Request production access to send to any email

## Security Best Practices

1. **Encrypt Credentials**: Always encrypt `providerConfig` before storing
2. **Use Environment Variables**: For default/system-wide providers
3. **Rotate Keys**: Regularly rotate API keys and passwords
4. **Limit Permissions**: Use least-privilege IAM roles for AWS SES
5. **Monitor Usage**: Track email sending for anomalies

## Error Handling

All providers return `SendEmailResult` with:
- `success`: Boolean indicating success/failure
- `messageId`: Provider's message ID (if successful)
- `error`: Error message (if failed)
- `errorCode`: Error code for programmatic handling

```typescript
const result = await provider.sendEmail(payload)

if (!result.success) {
  // Handle error
  console.error(`Email failed: ${result.error} (${result.errorCode})`)
  
  // Log to NotificationLog
  await NotificationLog.create({
    logId: generateLogId(),
    eventId: 'PR_CREATED',
    recipientEmail: payload.to,
    subject: payload.subject,
    status: 'FAILED',
    errorMessage: result.error,
  })
}
```

## Adding New Providers

To add a new email provider:

1. **Create Provider Class**: Implement `EmailProvider` interface
   ```typescript
   export class NewProvider implements EmailProvider {
     readonly providerCode = 'NEW_PROVIDER'
     // Implement all interface methods
   }
   ```

2. **Add to Factory**: Update `EmailProviderFactory.ts`
   ```typescript
   case 'NEW_PROVIDER':
     providerInstance = new NewProvider(senderId)
     await providerInstance.initialize(config)
     break
   ```

3. **Update Types**: Add provider type to `NotificationSenderProfile` enum

## Testing

### Unit Tests

```typescript
import { SMTPProvider } from '@/lib/providers/email/SMTPProvider'

describe('SMTPProvider', () => {
  it('should send email successfully', async () => {
    const provider = new SMTPProvider('test')
    await provider.initialize({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: { user: 'test', pass: 'test' },
      fromEmail: 'test@test.com',
    })

    const result = await provider.sendEmail({
      to: 'recipient@test.com',
      subject: 'Test',
      body: 'Test body',
      fromEmail: 'test@test.com',
    })

    expect(result.success).toBe(true)
  })
})
```

## Files Created

1. `lib/providers/email/EmailProvider.ts` - Interface definition
2. `lib/providers/email/SMTPProvider.ts` - SMTP implementation
3. `lib/providers/email/SendGridProvider.ts` - SendGrid implementation
4. `lib/providers/email/SESProvider.ts` - AWS SES implementation
5. `lib/providers/email/EmailProviderFactory.ts` - Factory for creating providers

## Dependencies

Install required packages:

```bash
# For SMTP
npm install nodemailer
npm install --save-dev @types/nodemailer

# For AWS SES
npm install @aws-sdk/client-ses

# For SendGrid (uses native fetch, no additional package needed)
```

## Next Steps

1. Implement notification service layer that uses these providers
2. Create queue processing worker for async email sending
3. Set up webhook handlers for delivery tracking
4. Add template rendering engine
5. Implement retry logic for failed emails

