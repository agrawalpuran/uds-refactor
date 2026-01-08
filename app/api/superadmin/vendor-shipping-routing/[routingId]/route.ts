import { NextResponse } from 'next/server'
import {
  getVendorShippingRoutingById,
  updateVendorShippingRouting,
  deleteVendorShippingRouting,
} from '@/lib/db/vendor-shipping-routing-access'

/**
 * GET /api/superadmin/vendor-shipping-routing/[routingId]
 * Get vendor shipping routing by ID
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ routingId: string }> }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ vs 15+)
    const resolvedParams = await params
    const { routingId } = resolvedParams

    if (!routingId || routingId === 'undefined' || routingId.trim() === '') {
      return NextResponse.json(
        { error: 'Routing ID is required' },
        { status: 400 }
      )
    }

    const routing = await getVendorShippingRoutingById(routingId)

    if (!routing) {
      return NextResponse.json(
        { error: `Routing not found: ${routingId}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ routing })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-shipping-routing/[routingId] GET:', error)
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
 * PUT /api/superadmin/vendor-shipping-routing/[routingId]
 * Update vendor shipping routing
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ routingId: string }> }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ vs 15+)
    const resolvedParams = await params
    const { routingId } = resolvedParams
    
    console.log('[API PUT /vendor-shipping-routing] Received routingId:', routingId)
    
    if (!routingId || routingId === 'undefined' || routingId.trim() === '') {
      console.error('[API PUT /vendor-shipping-routing] Invalid routingId:', routingId)
      return NextResponse.json(
        { error: 'Routing ID is required and cannot be undefined' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { primaryCourierCode, secondaryCourierCode, isActive } = body

    console.log('[API PUT /vendor-shipping-routing] Updating routing:', {
      routingId,
      primaryCourierCode,
      secondaryCourierCode,
      isActive,
    })

    const routing = await updateVendorShippingRouting(
      routingId,
      {
        primaryCourierCode,
        secondaryCourierCode,
        isActive,
      },
      'superadmin'
    )

    console.log('[API PUT /vendor-shipping-routing] Successfully updated routing:', routingId)
    return NextResponse.json({ routing })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-shipping-routing/[routingId] PUT:', error)
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
 * DELETE /api/superadmin/vendor-shipping-routing/[routingId]
 * Delete vendor shipping routing
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ routingId: string }> }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ vs 15+)
    const resolvedParams = await params
    const { routingId } = resolvedParams

    if (!routingId || routingId === 'undefined' || routingId.trim() === '') {
      return NextResponse.json(
        { error: 'Routing ID is required' },
        { status: 400 }
      )
    }

    await deleteVendorShippingRouting(routingId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Error in /api/superadmin/vendor-shipping-routing/[routingId] DELETE:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
      },
      { status: 500 }
    )
  }
}

