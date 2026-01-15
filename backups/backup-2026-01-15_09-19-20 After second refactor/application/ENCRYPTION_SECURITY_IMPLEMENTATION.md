# Encryption Security Implementation

## Overview
This document describes the security changes made to ensure sensitive employee data (names, emails, addresses, etc.) remains encrypted in the database and is only decrypted in the frontend for authorized users.

## Changes Made

### 1. Backend Changes ✅

#### Removed Decryption from Employee Model (`lib/models/Employee.ts`)
- **Removed**: Mongoose post hook that automatically decrypted sensitive fields after retrieval
- **Reason**: Data should remain encrypted in database and API responses

#### Removed Decryption from Data Access Layer (`lib/db/data-access.ts`)
- **Removed**: Decryption logic from `getAllEmployees()` - returns encrypted data
- **Removed**: Decryption logic from `getEmployeeById()` - returns encrypted data  
- **Removed**: Decryption logic from `getEmployeesByCompany()` - returns encrypted data
- **Kept**: Internal email decryption in `getEmployeeByEmail()` for matching purposes only (does not decrypt returned data)

### 2. Frontend Changes ⚠️ (Required)

#### Created Client-Side Decryption Utility (`lib/utils/client-decryption.ts`)
- New utility functions for decrypting data in the browser
- Uses Web Crypto API (requires HTTPS in production)
- Functions available:
  - `decrypt(encryptedText: string): Promise<string>` - Decrypt a single field
  - `decryptEmployee(employee: any): Promise<any>` - Decrypt an employee object
  - `decryptEmployees(employees: any[]): Promise<any[]>` - Decrypt an array of employees
  - `decryptFields<T>(obj: T, fields: (keyof T)[]): Promise<T>` - Decrypt specific fields

## Required Configuration

### Environment Variable
Add the encryption key to your `.env.local` file:

```bash
NEXT_PUBLIC_ENCRYPTION_KEY=your-encryption-key-here-32-chars-minimum!!
```

**IMPORTANT**: 
- The key must match `ENCRYPTION_KEY` used in backend
- Must be prefixed with `NEXT_PUBLIC_` for client-side access
- This exposes the key to the frontend (security trade-off for client-side decryption)

## Frontend Component Updates Required

### Components That Need Updates

The following components currently display employee data directly and need to be updated to decrypt before displaying:

1. **`app/dashboard/company/employees/page.tsx`**
   - Displays: `employee.firstName`, `employee.lastName`, `employee.email`, `employee.designation`
   - **Action**: Import `decryptEmployee` and decrypt before displaying

2. **`app/dashboard/company/page.tsx`**
   - Displays: `employee.firstName`, `employee.lastName`, `employee.email`, `employee.designation`
   - **Action**: Import `decryptEmployees` and decrypt the array before displaying

3. **`app/dashboard/consumer/profile/page.tsx`**
   - Displays: `employee.firstName`, `employee.lastName`, `employee.email`, etc.
   - **Action**: Import `decryptEmployee` and decrypt before displaying

4. **`components/DashboardLayout.tsx`**
   - Displays: `currentEmployee.firstName`, `currentEmployee.lastName`
   - **Action**: Import `decryptEmployee` and decrypt before displaying

### Example Usage

```typescript
import { decryptEmployee, decryptEmployees } from '@/lib/utils/client-decryption'

// For a single employee
const [employee, setEmployee] = useState<any>(null)

useEffect(() => {
  const loadEmployee = async () => {
    const response = await fetch('/api/employees/...')
    const data = await response.json()
    const decrypted = await decryptEmployee(data)
    setEmployee(decrypted)
  }
  loadEmployee()
}, [])

// For multiple employees
const [employees, setEmployees] = useState<any[]>([])

useEffect(() => {
  const loadEmployees = async () => {
    const response = await fetch('/api/employees/...')
    const data = await response.json()
    const decrypted = await decryptEmployees(data)
    setEmployees(decrypted)
  }
  loadEmployees()
}, [])
```

## Authorization

Decryption should only happen for authorized users:
- **Location Admin**: Can decrypt employees in their location
- **Company Admin**: Can decrypt employees in their company
- **Employee**: Can decrypt their own data

The frontend should check authorization before decrypting data.

## Security Considerations

### ⚠️ Important Notes

1. **Encryption Key Exposure**: The `NEXT_PUBLIC_ENCRYPTION_KEY` is exposed to the frontend, meaning anyone can decrypt data if they have access to the key. This is a security trade-off for client-side decryption.

2. **HTTPS Required**: Web Crypto API requires HTTPS in production. Ensure your production environment uses HTTPS.

3. **Browser Compatibility**: Web Crypto API is supported in modern browsers. Older browsers may not support it.

4. **Performance**: Decryption happens client-side, which may impact performance for large datasets. Consider pagination or lazy loading.

## Testing

After implementing frontend decryption:

1. Verify data is encrypted in database (check MongoDB directly)
2. Verify API responses contain encrypted data (check network tab)
3. Verify frontend displays decrypted data correctly
4. Test with different user roles (Location Admin, Company Admin, Employee)

## Migration Notes

- Existing encrypted data in database remains compatible
- No database migration required
- Frontend components need to be updated to use client-side decryption
- Backend no longer decrypts data (except for internal email matching)

## Next Steps

1. ✅ Backend decryption removed
2. ✅ Client-side decryption utility created
3. ⚠️ **TODO**: Update frontend components to use client-side decryption
4. ⚠️ **TODO**: Set `NEXT_PUBLIC_ENCRYPTION_KEY` environment variable
5. ⚠️ **TODO**: Test decryption in frontend
6. ⚠️ **TODO**: Verify authorization checks before decryption
