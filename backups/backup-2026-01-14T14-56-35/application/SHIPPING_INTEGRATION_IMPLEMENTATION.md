# Shipping Integration Implementation - Complete

## Overview

This document describes the complete shipping integration implementation for UDS, including runtime execution, provider abstraction, and status synchronization.

## Architecture

### 1. Data Models

#### Shipment Model (`lib/models/Shipment.ts`)
- Runtime shipment entity for tracking both MANUAL and API-backed shipments
- Fields: `shipmentId`, `prNumber`, `poNumber`, `vendorId`, `shipmentMode`, `providerId`, `providerShipmentReference`, `trackingNumber`, `trackingUrl`, `shipmentStatus`, `lastProviderSyncAt`, `rawProviderResponse`
- All fields nullable for backward compatibility

#### ShipmentApiLog Model (`lib/models/ShipmentApiLog.ts`)
- Audit trail for all API calls to logistics providers
- Fields: `logId`, `shipmentId`, `providerId`, `operationType`, `requestPayload`, `responsePayload`, `httpStatus`, `errorDetails`, `success`, `timestamp`

### 2. Provider Abstraction Layer

#### LogisticsProvider Interface (`lib/providers/LogisticsProvider.ts`)
- Provider-agnostic interface for all logistics operations
- Methods: `createShipment()`, `getShipmentStatus()`, `checkServiceability()`, `cancelShipment()`, `healthCheck()`
- Status normalization function: `normalizeShipmentStatus()`

#### ShipwayProvider Adapter (`lib/providers/ShipwayProvider.ts`)
- Concrete implementation for Shipway logistics
- Handles Shipway-specific API calls, authentication, and data mapping
- Extensible for additional providers

#### ProviderFactory (`lib/providers/ProviderFactory.ts`)
- Factory for creating and initializing provider instances
- Handles credential decryption and provider-specific initialization
- Function: `createProvider()`, `getEnabledProvidersForCompany()`

### 3. Shipment Execution Layer

#### Shipment Execution Functions (`lib/db/shipment-execution.ts`)
- `isApiShipmentEnabled(companyId)`: Check if API shipment is enabled for a company
- `createApiShipment(...)`: Create shipment via provider API
- `syncShipmentStatus(shipmentId)`: Sync single shipment status from provider
- `syncAllPendingShipments()`: Sync all pending API shipments
- `logShipmentApiCall(...)`: Log API calls for audit trail

### 4. API Endpoints

#### Enhanced `/api/prs/shipment` (POST)
- Supports both MANUAL and API shipment modes
- Validates API shipment requirements
- Falls back to manual if API fails (configurable)
- Updates PR/Order with shipment data

#### `/api/shipments/sync` (POST)
- Background job endpoint to sync all pending shipments
- Returns sync summary (synced count, errors)

#### `/api/companies/[companyId]/shipping-providers` (GET)
- Get enabled shipping providers for a company
- Used by vendor UI to show provider options

### 5. Status Sync Job

#### `scripts/sync-shipment-statuses.js`
- Standalone script to sync shipment statuses
- Can be run via cron job or scheduled task
- Processes all pending API shipments

## Workflow

### Manual Shipment (Existing - Unchanged)
1. Vendor marks order as shipped
2. Enters shipment details manually
3. PR/Order updated with shipment data
4. No provider API calls

### API Shipment (New)
1. Vendor marks order as shipped
2. Selects "Ship via Logistics Provider"
3. Chooses provider from dropdown
4. System calls provider API to create shipment
5. Shipment record created with provider reference
6. PR/Order updated with tracking data from provider
7. Background job syncs status periodically
8. When delivered, PR/Order delivery status updated automatically

## Status Synchronization

### Automatic Sync
- Background job (`sync-shipment-statuses.js`) runs periodically
- Fetches all API shipments not in DELIVERED/FAILED status
- Calls provider API for each shipment
- Updates shipment status and PR/Order delivery data
- Logs all API calls for audit

### Status Mapping
- Provider-specific statuses normalized to UDS standard:
  - `CREATED`: Shipment created, not yet picked up
  - `IN_TRANSIT`: Shipment in transit
  - `DELIVERED`: Shipment delivered
  - `FAILED`: Shipment failed/cancelled

## Feature Flags

### System Level
- `SystemShippingConfig.shippingIntegrationEnabled`: Master switch
- When `false`: All companies use manual shipment only
- When `true`: Companies with enabled providers can use API shipment

### Company Level
- `CompanyShippingProvider.isEnabled`: Provider enabled for company
- `CompanyShippingProvider.isDefault`: Default provider for company

## Backward Compatibility

- All new fields are nullable
- Existing manual shipment flow remains unchanged
- API shipment is opt-in per company
- No changes to PR/PO/GRN business rules
- Existing shipment data continues to work

## Testing

### Unit Tests (Recommended)
- Provider adapter methods
- Status mapping/normalization
- Serviceability checks

### Integration Tests (Recommended)
- Manual shipment (regression)
- API shipment creation
- Status sync → DELIVERED → GRN unlock
- Fallback to manual on API failure

### Failure Tests (Recommended)
- Invalid credentials
- Provider downtime
- Partial API responses
- Feature flag disabled

## Next Steps

1. **Vendor UI Enhancement**: Update vendor orders page to show API shipment option
2. **Status Sync Scheduling**: Set up cron job or scheduled task for `sync-shipment-statuses.js`
3. **Webhook Support**: Implement webhook endpoints for providers that support it
4. **Additional Providers**: Add more provider adapters (Delhivery, BlueDart, etc.)
5. **Serviceability Check**: Add UI for checking serviceability before shipment
6. **Error Handling**: Enhanced error messages and retry logic

## Files Created/Modified

### New Files
- `lib/models/Shipment.ts`
- `lib/models/ShipmentApiLog.ts`
- `lib/providers/LogisticsProvider.ts`
- `lib/providers/ShipwayProvider.ts`
- `lib/providers/ProviderFactory.ts`
- `lib/db/shipment-execution.ts`
- `app/api/shipments/sync/route.ts`
- `app/api/companies/[companyId]/shipping-providers/route.ts`
- `scripts/sync-shipment-statuses.js`

### Modified Files
- `app/api/prs/shipment/route.ts` (Enhanced to support API mode)

## Notes

- All provider-specific logic is isolated in provider adapters
- No hardcoded provider references outside adapters
- Manual shipment always available as fallback
- All API calls logged for debugging and audit
- Status sync is idempotent and safe to run frequently

