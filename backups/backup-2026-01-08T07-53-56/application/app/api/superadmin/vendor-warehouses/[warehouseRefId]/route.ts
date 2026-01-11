import { NextResponse } from 'next/server'
import {
  getVendorWarehouseById,
  updateVendorWarehouse,
  deleteVendorWarehouse,
} from '@/lib/db/vendor-warehouse-access'

/**
 * GET /api/superadmin/vendor-warehouses/[warehouseRefId]
 * Get vendor warehouse by ID
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ warehouseRefId: string }> }
) {
  try {
    const resolvedParams = await params
    const warehouseRefId = resolvedParams.warehouseRefId

    if (!warehouseRefId) {
      return NextResponse.json(
        { error: 'warehouseRefId is required' },
        { status: 400 }
      )
    }

    const warehouse = await getVendorWarehouseById(warehouseRefId)

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ warehouse })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-warehouses/[warehouseRefId] GET:', error)
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
 * PUT /api/superadmin/vendor-warehouses/[warehouseRefId]
 * Update vendor warehouse
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ warehouseRefId: string }> }
) {
  try {
    const resolvedParams = await params
    const warehouseRefId = resolvedParams.warehouseRefId
    const body = await request.json()

    if (!warehouseRefId) {
      return NextResponse.json(
        { error: 'warehouseRefId is required' },
        { status: 400 }
      )
    }

    // Validate pincode if provided
    if (body.pincode && !/^\d{6}$/.test(body.pincode)) {
      return NextResponse.json(
        { error: 'Pincode must be exactly 6 digits' },
        { status: 400 }
      )
    }

    const warehouse = await updateVendorWarehouse(
      warehouseRefId,
      body,
      'superadmin'
    )

    return NextResponse.json({ warehouse })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-warehouses/[warehouseRefId] PUT:', error)
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
 * DELETE /api/superadmin/vendor-warehouses/[warehouseRefId]
 * Delete vendor warehouse
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ warehouseRefId: string }> }
) {
  try {
    const resolvedParams = await params
    const warehouseRefId = resolvedParams.warehouseRefId

    if (!warehouseRefId) {
      return NextResponse.json(
        { error: 'warehouseRefId is required' },
        { status: 400 }
      )
    }

    await deleteVendorWarehouse(warehouseRefId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-warehouses/[warehouseRefId] DELETE:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
      },
      { status: 500 }
    )
  }
}

