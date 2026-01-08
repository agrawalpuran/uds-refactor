import { NextResponse } from 'next/server'
import {
  getVendorWarehouses,
  createVendorWarehouse,
} from '@/lib/db/vendor-warehouse-access'

/**
 * GET /api/superadmin/vendor-warehouses
 * Get vendor warehouses (with optional filters)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const isActive = searchParams.get('isActive')
    const isPrimary = searchParams.get('isPrimary')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required' },
        { status: 400 }
      )
    }

    const filters: any = {}
    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }
    if (isPrimary !== null) {
      filters.isPrimary = isPrimary === 'true'
    }

    const warehouses = await getVendorWarehouses(vendorId, filters)

    return NextResponse.json({ warehouses })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-warehouses GET:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/superadmin/vendor-warehouses
 * Create vendor warehouse
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      vendorId,
      warehouseName,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      pincode,
      contactName,
      contactPhone,
      isPrimary,
      isActive,
    } = body

    if (!vendorId || !warehouseName || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'vendorId, warehouseName, addressLine1, city, state, and pincode are required' },
        { status: 400 }
      )
    }

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Pincode must be exactly 6 digits' },
        { status: 400 }
      )
    }

    const warehouse = await createVendorWarehouse(
      {
        vendorId,
        warehouseName,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        pincode,
        contactName,
        contactPhone,
        isPrimary,
        isActive,
      },
      'superadmin'
    )

    return NextResponse.json({ warehouse })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-warehouses POST:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
      },
      { status: 500 }
    )
  }
}

