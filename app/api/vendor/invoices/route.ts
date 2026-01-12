import { NextResponse } from 'next/server'
import { createInvoiceByVendor, getInvoicesByVendor } from '@/lib/db/data-access'
// Ensure models are registered
import '@/lib/models/Invoice'
import '@/lib/models/GRN'

/**
 * GET /api/vendor/invoices
 * Get invoices raised by vendor
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
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
    console.error('API Error in /api/vendor/invoices GET:', error)
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    
    // Return 400 for validation/input errors
    if (errorMessage.includes('required') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('missing') ||
        errorMessage.includes('Invalid JSON')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    
    // Return 404 for not found errors
    if (errorMessage.includes('not found') || 
        errorMessage.includes('Not found') || 
        errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    
    // Return 401 for authentication errors
    if (errorMessage.includes('Unauthorized') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('token')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    
    // Return 500 for server errors
    return NextResponse.json(
      { error: errorMessage },
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
    // Parse JSON body with error handling
    let body: any
    try {
      body = await request.json()
    } catch (jsonError: any) {
      return NextResponse.json({
        error: 'Invalid JSON in request body'
      }, { status: 400 })
    const { grnId, invoiceNumber, invoiceDate, vendorInvoiceNumber, vendorInvoiceDate, invoiceAmount, vendorId, remarks, taxAmount } = body

    if (!grnId || !invoiceNumber || !invoiceDate || !vendorInvoiceNumber || !vendorInvoiceDate || !invoiceAmount || !vendorId) {
      return NextResponse.json(
        { error: 'Missing required fields: grnId, invoiceNumber, invoiceDate, vendorInvoiceNumber, vendorInvoiceDate, invoiceAmount, vendorId' },
        { status: 400 }
      )

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
    console.error('API Error in /api/vendor/invoices POST:', error)
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    
    // Return 400 for validation/input errors
    if (errorMessage.includes('required') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('missing') ||
        errorMessage.includes('Invalid JSON')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    
    // Return 404 for not found errors
    if (errorMessage.includes('not found') || 
        errorMessage.includes('Not found') || 
        errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    
    // Return 401 for authentication errors
    if (errorMessage.includes('Unauthorized') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('token')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    
    // Return 500 for server errors
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
