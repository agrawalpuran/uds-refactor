import { NextResponse } from 'next/server'
import { getGRNsPendingAcknowledgment, acknowledgeGRN } from '@/lib/db/data-access'
// Ensure models are registered
import '@/lib/models/GRN'

/**
 * GET /api/company/grns/acknowledge
 * Get GRNs pending acknowledgment by Company Admin
 * Query params:
 * - companyId: Company ID (optional filter)
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId') || undefined

    const grns = await getGRNsPendingAcknowledgment(companyId)
    return NextResponse.json(grns)
  } catch (error: any) {
    console.error('API Error in /api/company/grns/acknowledge GET:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/company/grns/acknowledge
 * Acknowledge GRN by Company Admin
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { grnId, acknowledgedBy } = body

    // Validate required fields
    if (!grnId) {
      return NextResponse.json(
        { error: 'GRN ID is required' },
        { status: 400 }
      )
    }

    if (!acknowledgedBy || !acknowledgedBy.trim()) {
      return NextResponse.json(
        { error: 'Acknowledged By (Company Admin ID/name) is required' },
        { status: 400 }
      )
    }

    console.log('[API /company/grns/acknowledge POST] Acknowledging GRN:', {
      grnId,
      acknowledgedBy: acknowledgedBy.trim()
    })

    // Acknowledge GRN
    const grn = await acknowledgeGRN(grnId, acknowledgedBy.trim())

    console.log('[API /company/grns/acknowledge POST] GRN acknowledged successfully')
    return NextResponse.json(grn, { status: 200 })
  } catch (error: any) {
    console.error('API Error in /api/company/grns/acknowledge POST:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

