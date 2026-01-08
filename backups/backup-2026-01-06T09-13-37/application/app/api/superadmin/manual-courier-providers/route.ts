import { NextResponse } from 'next/server'
import {
  getAllManualCourierProviders,
  createManualCourierProvider,
} from '@/lib/db/manual-courier-provider-access'
// Ensure model is registered
import '@/lib/models/ManualCourierProvider'

/**
 * GET /api/superadmin/manual-courier-providers
 * Get all manual courier providers
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const filters: any = {}
    if (isActive !== null && isActive !== '') {
      filters.isActive = isActive === 'true'
    }

    const couriers = await getAllManualCourierProviders(filters)

    return NextResponse.json({ couriers })
  } catch (error: any) {
    console.error('[API /superadmin/manual-courier-providers GET] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/superadmin/manual-courier-providers
 * Create manual courier provider
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      courierCode,
      courierName,
      isActive,
      contactWebsite,
      supportPhone,
      remarks,
    } = body

    if (!courierCode || !courierName) {
      return NextResponse.json(
        { error: 'courierCode and courierName are required' },
        { status: 400 }
      )
    }

    // Validate courierCode format
    if (!/^[A-Z0-9_-]+$/i.test(courierCode)) {
      return NextResponse.json(
        { error: 'Courier code must be alphanumeric with hyphens/underscores only' },
        { status: 400 }
      )
    }

    console.log('[API /superadmin/manual-courier-providers POST] Creating courier:', courierCode)

    const courier = await createManualCourierProvider({
      courierCode,
      courierName,
      isActive,
      contactWebsite,
      supportPhone,
      remarks,
    })

    console.log('[API /superadmin/manual-courier-providers POST] Courier created successfully:', courier.courierRefId)
    return NextResponse.json({ courier })
  } catch (error: any) {
    console.error('[API /superadmin/manual-courier-providers POST] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

