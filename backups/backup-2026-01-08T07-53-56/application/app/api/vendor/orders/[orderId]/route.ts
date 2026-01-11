import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Order from '@/lib/models/Order'
import Shipment from '@/lib/models/Shipment'
import POOrder from '@/lib/models/POOrder'

/**
 * GET /api/vendor/orders/[orderId]
 * Get order details with shipment information for vendor
 * Returns all PRs (orders) under the same PO for PO-centric view
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
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

    // Find PO(s) for this order via POOrder mapping
    const poOrderMappings = await POOrder.find({ order_id: order._id })
      .populate('purchase_order_id', 'id client_po_number po_date')
      .lean()

    let poNumber: string | null = null
    let poDate: Date | null = null
    let allPRs: any[] = [order] // Start with the current order

    if (poOrderMappings.length > 0) {
      // Use the first PO (primary PO)
      const primaryPO = poOrderMappings[0].purchase_order_id as any
      poNumber = primaryPO?.client_po_number || null
      poDate = primaryPO?.po_date ? new Date(primaryPO.po_date) : null

      // Find all other orders (PRs) under the same PO
      if (primaryPO?._id) {
        const allPOOrderMappings = await POOrder.find({ purchase_order_id: primaryPO._id })
          .populate('order_id')
          .lean()

        // Extract order IDs - handle both populated documents and ObjectIds
        const allOrderIds = allPOOrderMappings
          .map((m: any) => {
            if (m.order_id) {
              // If populated, use _id from the document
              if (typeof m.order_id === 'object' && m.order_id._id) {
                return m.order_id._id
              }
              // If it's already an ObjectId, use it directly
              return m.order_id
            }
            return null
          })
          .filter(Boolean)

        if (allOrderIds.length > 0) {
          // Fetch all orders (PRs) for this PO, ensuring they belong to the same vendor
          const allOrdersForPO = await Order.find({
            _id: { $in: allOrderIds },
            vendorId: vendorId
          })
            .populate('employeeId', 'id firstName lastName email')
            .populate('companyId', 'id name')
            .populate('items.uniformId', 'id name')
            .lean()

          allPRs = allOrdersForPO
        }
      }
    }

    // Fetch shipments for all PRs
    const shipmentsMap = new Map<string, any>()
    for (const pr of allPRs) {
      let shipment = null
      if (pr.shipmentId) {
        shipment = await Shipment.findOne({ shipmentId: pr.shipmentId }).lean()
      } else if (pr.pr_number) {
        shipment = await Shipment.findOne({ prNumber: pr.pr_number, vendorId }).lean()
      }
      if (shipment) {
        shipmentsMap.set(pr._id.toString(), shipment)
      }
    }

    return NextResponse.json({
      success: true,
      poNumber,
      poDate,
      prs: allPRs.map((pr: any) => ({
        ...pr,
        shipment: shipmentsMap.get(pr._id.toString()) || null
      })),
      // Keep backward compatibility - return first PR as 'order' and its shipment
      order: allPRs[0],
      shipment: shipmentsMap.get(allPRs[0]._id.toString()) || null,
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

