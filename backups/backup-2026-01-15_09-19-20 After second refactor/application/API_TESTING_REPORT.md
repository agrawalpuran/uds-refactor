# API Testing Report

## Overview

This document describes the comprehensive API testing infrastructure created for the UDS application after the ObjectId → string ID refactor.

## Test Infrastructure

### 1. Route Map Generator (`scripts/generate-api-route-map.js`)

Scans all API routes and generates a comprehensive route map including:
- HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Path parameters
- Query parameters
- Body parameters
- Authentication requirements
- ObjectId fallback detection
- String ID query detection

**Usage:**
```bash
npm run test:api:map
```

**Output:** `api-route-map.json`

### 2. Test File Generator (`scripts/generate-api-tests.js`)

Automatically generates test files for all API routes.

**Usage:**
```bash
npm run test:api:generate
```

**Output:** Test files in `tests/api/` directory

### 3. HTTP-Based Test Runner (`scripts/run-api-tests.js`)

Executes API tests by making actual HTTP requests to a running server.

**Usage:**
```bash
# Start dev server first
npm run dev

# In another terminal, run tests
npm run test:api
```

**Features:**
- Tests all routes automatically
- Validates responses
- Detects ObjectId usage in responses
- Validates string ID format
- Generates comprehensive test report

## Test Coverage

### Total Routes: 93

**By HTTP Method:**
- GET: 70 routes
- POST: 57 routes
- PUT: 24 routes
- DELETE: 18 routes
- PATCH: 5 routes

**Routes with ObjectId Fallback (Needs Review):**
1. `/debug/vendor-products` (GET)
2. `/orders/bulk-excel` (POST)
3. `/product-subcategory-mappings` (GET, POST, DELETE)
4. `/prs/shipment` (POST, PUT)
5. `/superadmin/create-test-orders` (POST)

**Routes with String ID Queries:**
21 routes confirmed to use string ID queries (`findOne({ id: ... })`)

## Test Cases Generated

For each route, the following test cases are generated:

1. **Happy Path Test**
   - Valid request with proper parameters
   - Validates response status (2xx, 3xx, or 4xx acceptable)
   - Checks for ObjectId strings in response
   - Validates string ID format

2. **Missing Required Parameters Test**
   - Tests error handling for missing parameters
   - Expects 400 or 401 status

3. **Invalid Input Test**
   - Tests validation with invalid input
   - Expects 4xx status

4. **String ID Validation Test**
   - Tests with ObjectId-like strings
   - Validates that routes reject or convert ObjectIds

5. **ObjectId Fallback Detection Test**
   - For routes with detected ObjectId fallback
   - Warns if route accepts ObjectId input

## Mock Data

Mock data is available in `tests/api/mocks/string-id-mocks.ts`:

- `mockCompany` - Company with string ID `100001`
- `mockEmployee` - Employee with string ID `300001`
- `mockLocation` - Location with string ID `400001`
- `mockVendor` - Vendor with string ID `100001`
- `mockProduct` - Product with string ID `200001`
- `mockOrder` - Order with string ID `ORD-001`
- `mockCategory` - Category with string ID `500001`
- `mockSubcategory` - Subcategory with string ID `600001`
- And more...

All mocks use 6-digit numeric string IDs, not ObjectIds.

## Test Execution

### Prerequisites

1. Development server must be running:
   ```bash
   npm run dev
   ```

2. Database must be accessible (local or test database)

### Running Tests

```bash
npm run test:api
```

### Test Output

The test runner provides:
- Real-time progress
- Pass/fail status for each test
- Warnings for potential issues
- Summary by route
- Full JSON report saved to `api-test-report.json`

## Test Report Format

```json
{
  "timestamp": "2026-01-08T...",
  "summary": {
    "total": 93,
    "passed": 85,
    "failed": 8,
    "warnings": 5,
    "duration": 12345
  },
  "passed": [...],
  "failed": [...],
  "warnings": [...]
}
```

## Validation Checks

### String ID Validation
- Checks that IDs are 6-digit numeric strings (`/^\d{6}$/`)
- Warns if ObjectId-like strings are found (`/[0-9a-fA-F]{24}/`)

### ObjectId Fallback Detection
- Scans route files for ObjectId patterns:
  - `findById(`
  - `new mongoose.Types.ObjectId`
  - `ObjectId.isValid(`
- Flags routes that may still use ObjectId fallback

### Response Validation
- Validates response structure
- Checks status codes
- Detects ObjectId strings in responses
- Validates string ID format in response data

## Next Steps

1. **Run Full Test Suite**
   - Start dev server
   - Execute `npm run test:api`
   - Review test report

2. **Fix Failing Tests**
   - Review `api-test-report.json`
   - Fix routes with failures
   - Re-run tests

3. **Address ObjectId Fallback Routes**
   - Review 5 routes with detected ObjectId fallback
   - Remove fallback logic
   - Re-test

4. **Continuous Testing**
   - Integrate into CI/CD pipeline
   - Run tests before deployment
   - Monitor for regressions

## Files Created

- `scripts/generate-api-route-map.js` - Route map generator
- `scripts/generate-api-tests.js` - Test file generator
- `scripts/run-api-tests.js` - HTTP-based test runner
- `tests/api/mocks/string-id-mocks.ts` - Mock data
- `tests/api/test-setup.ts` - Test utilities
- `tests/api/test-runner.ts` - Test runner (TypeScript version)
- `api-route-map.json` - Generated route map
- `api-test-report.json` - Test execution report (generated after running tests)

## Notes

- Tests require a running server (cannot test routes in isolation)
- Some routes may require authentication (tests may need auth tokens)
- Database state affects test results (consider using test database)
- ObjectId fallback detection is based on static code analysis (may have false positives)
