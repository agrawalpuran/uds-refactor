import { NextResponse } from 'next/server'
import {
  createOrderSuborder,
  updateSuborderShipping,
  getSubordersByOrderId,
  getSubordersByVendorId,
  deriveMasterOrderStatus,
} from '@/lib/db/indent-workflow'
import { getVendorById } from '@/lib/data-mongodb'


// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id, vendor_id, vendor_indent_id } = body

    if (!order_id || !vendor_id) {
      return NextResponse.json(
        { error: 'order_id and vendor_id are required' },
        { status: 400 }
      )
    }

    const suborder = await createOrderSuborder({
      order_id,
      vendor_id,
      vendor_indent_id,
    })

    return NextResponse.json({ success: true, suborder }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating suborder:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create suborder' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const {
      suborder_id,
      shipper_name,
      consignment_number,
      shipping_date,
      shipment_status,
      vendorId, // For vendor authorization
    } = body

    if (!suborder_id) {
      return NextResponse.json(
        { error: 'suborder_id is required' },
        { status: 400 }
      )
    }

    // TODO: Add vendor authorization check if vendorId is provided

    const suborder = await updateSuborderShipping({
      suborder_id,
      shipper_name,
      consignment_number,
      shipping_date: shipping_date ? new Date(shipping_date) : undefined,
      shipment_status,
    })

    return NextResponse.json({ success: true, suborder })
  } catch (error: any) {
    console.error('Error updating suborder:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update suborder' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const vendorId = searchParams.get('vendorId')

    if (orderId) {
      const suborders = await getSubordersByOrderId(orderId)
      return NextResponse.json({ success: true, suborders })
    }

    if (vendorId) {
      const suborders = await getSubordersByVendorId(vendorId)
      return NextResponse.json({ success: true, suborders })
    }

    return NextResponse.json(
      { error: 'orderId or vendorId is required' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error fetching suborders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suborders' },
      { status: 500 }
    )
  }
}

