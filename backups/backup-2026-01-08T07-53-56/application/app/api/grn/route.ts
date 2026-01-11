import { NextResponse } from 'next/server'
import {
  createGRN,
  submitGRN,
} from '@/lib/db/indent-workflow'


// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendor_indent_id, vendor_id, grn_number, grn_date, remarks } = body

    if (!vendor_indent_id || !vendor_id || !grn_number || !grn_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const grn = await createGRN({
      vendor_indent_id,
      vendor_id,
      grn_number,
      grn_date: new Date(grn_date),
      remarks,
    })

    return NextResponse.json({ success: true, grn }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating GRN:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create GRN' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { grn_id, action } = body

    if (!grn_id || !action) {
      return NextResponse.json(
        { error: 'grn_id and action are required' },
        { status: 400 }
      )
    }

    if (action === 'submit') {
      const grn = await submitGRN(grn_id)
      
      return NextResponse.json({ success: true, grn })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error updating GRN:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update GRN' },
      { status: 500 }
    )
  }
}

