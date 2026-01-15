# Email Notification System - Data Model Design

## Overview

This document describes the data model structure for the UDS Email Notification System. This is a **design-only** implementation - no business logic or API endpoints are included. The models are ready for future implementation of email notification functionality.

## Design Principles

1. **Scalable**: Supports multiple companies, events, templates, and recipients
2. **Flexible**: Configurable per company, per event
3. **Extensible**: Can be extended for SMS/Push notifications in the future
4. **Auditable**: Complete audit trail of all notifications sent
5. **Secure**: Sensitive provider configurations are encrypted
6. **Non-Breaking**: No changes to existing UDS functionality

## Data Model Architecture

```
┌─────────────────────┐
│ NotificationEvent   │ (Master list of events)
└──────────┬──────────┘
           │
           ├─────────────────┐
           │                 │
┌──────────▼──────────┐  ┌───▼──────────────────┐
│ NotificationTemplate│  │ NotificationRouting   │
│ (Email templates)   │  │ (Who gets emails)     │
└──────────┬──────────┘  └───┬───────────────────┘
           │                 │
           │                 │
┌──────────▼─────────────────▼──────────┐
│ NotificationQueue                    │
│ (Pending notifications)               │
└──────────┬────────────────────────────┘
           │
           │
┌──────────▼──────────┐
│ NotificationLog    │
│ (Audit trail)      │
└─────────────────────┘

┌─────────────────────┐
│ NotificationSender  │
│ Profile             │
│ (From address)      │
└─────────────────────┘
```

## Model Details

### 1. NotificationEvent

**Purpose**: Master list of all notification events/triggers in the system.

**Key Fields**:
- `eventId`: Numeric ID (500000-509999)
- `eventCode`: Unique event code (e.g., "PR_CREATED", "PO_GENERATED")
- `eventDescription`: Human-readable description
- `defaultRecipientType`: Default recipient type (EMPLOYEE/VENDOR/ADMIN)
- `isActive`: Enable/disable event

**Predefined Events** (to be populated during initialization):
1. `PR_CREATED` - When employee raises an order
2. `PR_APPROVED_BY_LOCATION_ADMIN` - When location admin approves PR
3. `PR_NUMBER_ASSIGNED` - When PR number is assigned
4. `PR_APPROVED_BY_COMPANY_ADMIN` - When company admin approves PR
5. `PO_GENERATED` - When PO is generated
6. `PO_SENT_TO_VENDOR` - When vendor receives new PO
7. `ORDER_MARKED_SHIPPED` - When vendor marks as shipped
8. `SHIPMENT_CREATED` - When shipment is created (API or manual)
9. `AWB_ASSIGNED` - When AWB is assigned
10. `ORDER_MARKED_DELIVERED` - When vendor marks delivered
11. `DELIVERY_DETECTED` - When system detects delivery from tracking provider

### 2. NotificationTemplate

**Purpose**: Stores reusable email templates for each notification event.

**Key Fields**:
- `templateId`: Numeric ID (600000-699999)
- `eventId`: Foreign key to NotificationEvent
- `templateName`: Human-readable template name
- `subjectTemplate`: Email subject with placeholders
- `bodyTemplate`: Email body (HTML/text) with placeholders
- `language`: Language code (default: "en")
- `isActive`: Enable/disable template

**Template Placeholders** (examples):
- `{{employeeName}}` - Employee name
- `{{prNumber}}` - PR number
- `{{poNumber}}` - PO number
- `{{orderId}}` - Order ID
- `{{awbNumber}}` - AWB number
- `{{vendorName}}` - Vendor name
- `{{companyName}}` - Company name
- `{{shipmentDate}}` - Shipment date
- `{{deliveryDate}}` - Delivery date

### 3. NotificationRouting

**Purpose**: Controls notification rules per company, per event.

**Key Fields**:
- `routingId`: Numeric ID (700000-799999)
- `eventId`: Foreign key to NotificationEvent
- `companyId`: Foreign key to Company
- `sendToEmployee`: Boolean flag
- `sendToVendor`: Boolean flag
- `sendToLocationAdmin`: Boolean flag
- `sendToCompanyAdmin`: Boolean flag
- `sendToCustomEmail`: Custom email address (optional)
- `isEnabled`: Master switch

**Unique Constraint**: One routing rule per event per company.

### 4. NotificationSenderProfile

**Purpose**: Stores "From" email profile and provider configuration per company.

**Key Fields**:
- `senderId`: Numeric ID (800000-899999)
- `companyId`: Foreign key to Company
- `senderName`: Display name (e.g., "UDS Support")
- `senderEmail`: "From" email address
- `replyToEmail`: Reply-To address (optional)
- `useDefaultProvider`: Use system default provider
- `providerType`: SMTP/SENDGRID/SES/MAILGUN/CUSTOM
- `providerConfig`: Encrypted JSON configuration
- `isActive`: Enable/disable profile

**Security**: `providerConfig` is encrypted at rest using UDS encryption utilities.

### 5. NotificationQueue

**Purpose**: Queued messages for async processing (future use).

**Key Fields**:
- `queueId`: Numeric ID (900000-999999)
- `eventId`: Foreign key to NotificationEvent
- `entityType`: PR/PO/SHIPMENT/ORDER/etc.
- `entityId`: ID of the entity
- `recipientEmail`: Recipient email address
- `recipientType`: Type of recipient
- `templateId`: Foreign key to NotificationTemplate
- `senderId`: Foreign key to NotificationSenderProfile
- `payloadData`: JSON snapshot of merged template
- `status`: PENDING/PROCESSING/SENT/FAILED/RETRY/CANCELLED
- `retryCount`: Number of retry attempts
- `scheduledAt`: Scheduled send time (for delayed notifications)

**Note**: This model is for future async processing. No business logic implemented yet.

### 6. NotificationLog

**Purpose**: Permanent audit trail of all emails sent.

**Key Fields**:
- `logId`: Numeric ID (950000-999999)
- `queueId`: Foreign key to NotificationQueue (nullable)
- `eventId`: Foreign key to NotificationEvent
- `recipientEmail`: Recipient email address
- `recipientType`: Type of recipient
- `subject`: Final email subject
- `status`: SENT/FAILED/BOUNCED/REJECTED
- `providerResponse`: JSON response from provider
- `providerMessageId`: Provider's message ID
- `sentAt`: Timestamp when sent
- `deliveredAt`: Timestamp when delivered (if available)
- `openedAt`: Timestamp when opened (if tracking enabled)

**Note**: This is a write-only log table. Records should never be deleted.

## Relationships

1. **NotificationEvent** → **NotificationTemplate** (1:many)
   - One event can have multiple templates (different languages, versions)

2. **NotificationEvent** → **NotificationRouting** (1:many)
   - One event can have multiple routing rules (per company)

3. **NotificationEvent** → **NotificationQueue** (1:many)
   - One event can trigger multiple queued notifications

4. **NotificationEvent** → **NotificationLog** (1:many)
   - One event can result in multiple log entries

5. **Company** → **NotificationRouting** (1:many)
   - One company can have multiple routing rules

6. **Company** → **NotificationSenderProfile** (1:many)
   - One company can have multiple sender profiles

7. **NotificationQueue** → **NotificationLog** (1:1 or 1:many)
   - One queue entry can result in one or more log entries (retries)

## Indexes

All models include appropriate indexes for:
- Primary keys (eventId, templateId, routingId, etc.)
- Foreign keys (eventId, companyId, etc.)
- Status fields (isActive, status)
- Compound indexes for common query patterns
- Timestamps for time-based queries

## ID Ranges

- **NotificationEvent**: 500000-509999
- **NotificationTemplate**: 600000-699999
- **NotificationRouting**: 700000-799999
- **NotificationSenderProfile**: 800000-899999
- **NotificationQueue**: 900000-999999
- **NotificationLog**: 950000-999999

## Future Extensibility

The data model is designed to support:
1. **SMS Notifications**: Add `channel` field (EMAIL/SMS/PUSH) to NotificationQueue
2. **Multi-language**: Already supported via `language` field in NotificationTemplate
3. **Scheduled Notifications**: Already supported via `scheduledAt` in NotificationQueue
4. **Notification Preferences**: Can add user preference model linked to Employee/Vendor
5. **Template Variables**: Extend payloadData structure for dynamic variables

## Implementation Notes

1. **No Business Logic**: These models are schema-only. No email sending logic is implemented.
2. **No API Endpoints**: No REST APIs or routes are created.
3. **No Integration**: No email provider integration is included.
4. **Backward Compatible**: No changes to existing UDS models or functionality.

## Next Steps (Future Implementation)

1. Create data access layer functions
2. Implement email provider adapters (SMTP, SendGrid, SES, etc.)
3. Create notification service layer
4. Implement queue processing worker
5. Create API endpoints for configuration
6. Add webhook handlers for email provider callbacks
7. Implement template rendering engine
8. Add notification preference management

## Files Created

1. `lib/models/NotificationEvent.ts` - Event master list
2. `lib/models/NotificationTemplate.ts` - Email templates
3. `lib/models/NotificationRouting.ts` - Routing rules
4. `lib/models/NotificationSenderProfile.ts` - Sender profiles
5. `lib/models/NotificationQueue.ts` - Queue for async processing
6. `lib/models/NotificationLog.ts` - Audit log
7. `lib/utils/notification-id-generator.ts` - ID generation utilities

## Validation

All models include:
- Field validation (email format, enum values, etc.)
- Required field checks
- Index definitions for performance
- Timestamps for audit
- Proper TypeScript interfaces

