import { NextResponse } from 'next/server'
import { createInvoiceByVendor, getInvoicesByVendor } from '@/lib/db/data-access'
// Ensure models are registered
import '@/lib/models/Invoice'
import '@/lib/models/GRN'

/**
 * GET /api/vendor/invoices
 * Get invoices raised by vendor
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    const invoices = await getInvoicesByVendor(vendorId)
    return NextResponse.json(invoices)
  } catch (error: any) {
    console.error('API Error in /api/vendor/invoices GET:', error)
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
 * POST /api/vendor/invoices
 * Create invoice by vendor
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { grnId, invoiceNumber, invoiceDate, vendorInvoiceNumber, vendorInvoiceDate, invoiceAmount, vendorId, remarks, taxAmount } = body

    if (!grnId || !invoiceNumber || !invoiceDate || !vendorInvoiceNumber || !vendorInvoiceDate || !invoiceAmount || !vendorId) {
      return NextResponse.json(
        { error: 'Missing required fields: grnId, invoiceNumber, invoiceDate, vendorInvoiceNumber, vendorInvoiceDate, invoiceAmount, vendorId' },
        { status: 400 }
      )
    }

    console.log('[API /vendor/invoices POST] Creating invoice:', {
      grnId,
      invoiceNumber,
      invoiceDate,
      vendorInvoiceNumber,
      vendorInvoiceDate,
      invoiceAmount,
      vendorId
    })

    const invoice = await createInvoiceByVendor(
      grnId,
      invoiceNumber,
      new Date(invoiceDate),
      vendorInvoiceNumber,
      new Date(vendorInvoiceDate),
      invoiceAmount,
      vendorId,
      remarks,
      taxAmount
    )

    console.log('[API /vendor/invoices POST] Invoice created successfully')
    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error('API Error in /api/vendor/invoices POST:', error)
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
