import { NextResponse } from 'next/server'
import { getGRNsRaisedByVendors } from '@/lib/db/data-access'
// Ensure models are registered
import '@/lib/models/GRN'
import '@/lib/models/PurchaseOrder'
import '@/lib/models/POOrder'
import '@/lib/models/Order'

/**
 * POST /api/grns
 * NOTE: GRN creation is now vendor-led workflow
 * Vendors create GRNs via /api/vendor/grns endpoint
 * This endpoint is kept for backward compatibility but returns an error
 */
export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'GRN creation is now vendor-led. Please use /api/vendor/grns endpoint.' },
    { status: 400 }
  )
}

/**
 * GET /api/grns
 * Get GRNs for a company
 * Supports query params:
 * - companyId: Company ID (required for standard query)
 * - vendorId: Vendor ID (optional filter)
 * - status: GRN status (optional filter)
 * - raisedByVendors: If true, returns all GRNs raised by vendors (companyId optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status') as 'CREATED' | 'RECEIVED' | 'CLOSED' | null
    const raisedByVendors = searchParams.get('raisedByVendors') === 'true'

    // If raisedByVendors=true, use the new function
    if (raisedByVendors) {
      const grns = await getGRNsRaisedByVendors(companyId || undefined)
      return NextResponse.json(grns)
    }

    // Standard query requires companyId
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // For standard queries, return GRNs raised by vendors for the company
    const grns = await getGRNsRaisedByVendors(companyId)
    
    // Apply optional filters
    let filteredGRNs = grns
    if (vendorId) {
      filteredGRNs = filteredGRNs.filter((g: any) => g.vendorId === vendorId)
    }
    if (status) {
      filteredGRNs = filteredGRNs.filter((g: any) => g.status === status)
    }

    return NextResponse.json(filteredGRNs)
  } catch (error: any) {
    console.error('API Error in /api/grns GET:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/grns
 * NOTE: GRN status updates are now handled via approval workflow
 * Use /api/grns/approve for approval
 * Use /api/company/grns/acknowledge for acknowledgment
 */
export async function PUT(request: Request) {
  return NextResponse.json(
    { error: 'GRN status updates are handled via approval/acknowledgment endpoints.' },
    { status: 400 }
  )
}

