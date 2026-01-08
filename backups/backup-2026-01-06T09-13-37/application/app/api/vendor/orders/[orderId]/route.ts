import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Order from '@/lib/models/Order'
import Shipment from '@/lib/models/Shipment'

/**
 * GET /api/vendor/orders/[orderId]
 * Get order details with shipment information for vendor
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find order and verify vendor authorization
    const order = await Order.findOne({ id: orderId, vendorId })
      .populate('employeeId', 'id firstName lastName email')
      .populate('companyId', 'id name')
      .populate('items.uniformId', 'id name')
      .lean()

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    // Find associated shipment if exists
    let shipment = null
    if (order.shipmentId) {
      shipment = await Shipment.findOne({ shipmentId: order.shipmentId }).lean()
    } else if (order.pr_number) {
      // Try to find shipment by PR number
      shipment = await Shipment.findOne({ prNumber: order.pr_number, vendorId }).lean()
    }

    return NextResponse.json({
      success: true,
      order,
      shipment,
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /vendor/orders/[orderId]] Error:', error)
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

