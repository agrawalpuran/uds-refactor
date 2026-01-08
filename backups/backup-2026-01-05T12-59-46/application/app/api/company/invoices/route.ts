import { NextResponse } from 'next/server'
import { getInvoicesForCompany, approveInvoice } from '@/lib/db/data-access'
// Ensure models are registered
import '@/lib/models/Invoice'

/**
 * GET /api/company/invoices
 * Get invoices for company admin
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    const invoices = await getInvoicesForCompany(companyId || undefined)
    return NextResponse.json(invoices)
  } catch (error: any) {
    console.error('API Error in /api/company/invoices GET:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error'
      },
      { status: 500 }
    )
  }
}

