import { NextResponse } from 'next/server'
import {
  createVendorInvoice,
  submitInvoice,
} from '@/lib/db/indent-workflow'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendor_indent_id, vendor_id, invoice_number, invoice_date, invoice_amount } = body

    if (!vendor_indent_id || !vendor_id || !invoice_number || !invoice_date || !invoice_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const invoice = await createVendorInvoice({
      vendor_indent_id,
      vendor_id,
      invoice_number,
      invoice_date: new Date(invoice_date),
      invoice_amount,
    })

    return NextResponse.json({ success: true, invoice }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { invoice_id, action } = body

    if (!invoice_id || !action) {
      return NextResponse.json(
        { error: 'invoice_id and action are required' },
        { status: 400 }
      )
    }

    if (action === 'submit') {
      const invoice = await submitInvoice(invoice_id)
      
      return NextResponse.json({ success: true, invoice })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

