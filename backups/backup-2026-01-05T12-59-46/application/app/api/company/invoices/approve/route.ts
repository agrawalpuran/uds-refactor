import { NextResponse } from 'next/server'
import { approveInvoice } from '@/lib/db/data-access'
// Ensure models are registered
import '@/lib/models/Invoice'

/**
 * POST /api/company/invoices/approve
 * Approve invoice by Company Admin
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId, approvedBy } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    if (!approvedBy) {
      return NextResponse.json(
        { error: 'Approved By (Company Admin identifier) is required' },
        { status: 400 }
      )
    }

    console.log('[API /company/invoices/approve POST] Approving invoice:', {
      invoiceId,
      approvedBy
    })

    const approvedInvoice = await approveInvoice(invoiceId, approvedBy)

    console.log('[API /company/invoices/approve POST] Invoice approved successfully')
    return NextResponse.json(approvedInvoice, { status: 200 })
  } catch (error: any) {
    console.error('API Error in /api/company/invoices/approve POST:', error)
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

