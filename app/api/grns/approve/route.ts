import { NextResponse } from 'next/server'
import { approveGRN } from '@/lib/db/data-access'
// Ensure models are registered
import '@/lib/models/GRN'

/**
 * POST /api/grns/approve
 * Approve GRN by Company Admin (Simple Approval Workflow)
 * Updates grnStatus from RAISED to APPROVED
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { grnId, approvedBy } = body

    if (!grnId) {
      return NextResponse.json(
        { error: 'GRN ID is required' },
        { status: 400 }
      )
    }

    if (!approvedBy) {
      return NextResponse.json(
        { error: 'Approved By (Company Admin identifier) is required' },
        { status: 400 }
      )
    }

    console.log('[API /grns/approve POST] Approving GRN:', {
      grnId,
      approvedBy
    })

    const approvedGRN = await approveGRN(grnId, approvedBy)

    console.log('[API /grns/approve POST] GRN approved successfully')
    return NextResponse.json(approvedGRN, { status: 200 })
  } catch (error: any) {
    console.error('API Error in /api/grns/approve POST:', error)
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

