import { NextResponse } from 'next/server'
import {
  getAllVendorShippingRoutings,
  createVendorShippingRouting,
  getVendorShippingRouting,
} from '@/lib/db/vendor-shipping-routing-access'
import { getAllShipmentServiceProviders } from '@/lib/db/shipping-config-access'

/**
 * GET /api/superadmin/vendor-shipping-routing
 * Get vendor shipping routings (with optional filters)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const companyId = searchParams.get('companyId')
    const shipmentServiceProviderRefId = searchParams.get('shipmentServiceProviderRefId')
    const isActive = searchParams.get('isActive')

    const filters: any = {}
    if (vendorId) filters.vendorId = vendorId
    if (companyId) filters.companyId = companyId
    if (shipmentServiceProviderRefId) {
      filters.shipmentServiceProviderRefId = parseInt(shipmentServiceProviderRefId, 10)
    }
    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }

    const routings = await getAllVendorShippingRoutings(filters)

    return NextResponse.json({ routings })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-shipping-routing GET:', error)
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
 * POST /api/superadmin/vendor-shipping-routing
 * Create vendor shipping routing
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      vendorId,
      companyId,
      shipmentServiceProviderRefId,
      primaryCourierCode,
      secondaryCourierCode,
      isActive,
    } = body

    if (!vendorId || !companyId || !shipmentServiceProviderRefId || !primaryCourierCode) {
      return NextResponse.json(
        { error: 'vendorId, companyId, shipmentServiceProviderRefId, and primaryCourierCode are required' },
        { status: 400 }
      )
    }

    const routing = await createVendorShippingRouting(
      {
        vendorId,
        companyId,
        shipmentServiceProviderRefId: parseInt(shipmentServiceProviderRefId, 10),
        primaryCourierCode,
        secondaryCourierCode,
        isActive,
      },
      'superadmin'
    )

    return NextResponse.json({ routing })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-shipping-routing POST:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
      },
      { status: 500 }
    )
  }
}

