import { NextResponse } from 'next/server'
import {
  getManualCourierProviderById,
  updateManualCourierProvider,
  deleteManualCourierProvider,
} from '@/lib/db/manual-courier-provider-access'

/**
 * GET /api/superadmin/manual-courier-providers/[courierRefId]
 * Get manual courier provider by ID
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courierRefId: string }> }
) {
  try {
    const { courierRefId } = await params

    const courier = await getManualCourierProviderById(courierRefId)

    if (!courier) {
      return NextResponse.json(
        { error: 'Courier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ courier })
  } catch (error: any) {
    console.error('[API /superadmin/manual-courier-providers/[courierRefId] GET] Error:', error)
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
 * PUT /api/superadmin/manual-courier-providers/[courierRefId]
 * Update manual courier provider
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courierRefId: string }> }
) {
  try {
    const { courierRefId } = await params
    const body = await request.json()
    const {
      courierCode,
      courierName,
      isActive,
      contactWebsite,
      supportPhone,
      remarks,
    } = body

    // Validate courierCode format if provided
    if (courierCode && !/^[A-Z0-9_-]+$/i.test(courierCode)) {
      return NextResponse.json(
        { error: 'Courier code must be alphanumeric with hyphens/underscores only' },
        { status: 400 }
      )
    }

    const courier = await updateManualCourierProvider(courierRefId, {
      courierCode,
      courierName,
      isActive,
      contactWebsite,
      supportPhone,
      remarks,
    })

    return NextResponse.json({ courier })
  } catch (error: any) {
    console.error('[API /superadmin/manual-courier-providers/[courierRefId] PUT] Error:', error)
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
 * DELETE /api/superadmin/manual-courier-providers/[courierRefId]
 * Delete manual courier provider (soft delete)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ courierRefId: string }> }
) {
  try {
    const { courierRefId } = await params

    await deleteManualCourierProvider(courierRefId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API /superadmin/manual-courier-providers/[courierRefId] DELETE] Error:', error)
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

