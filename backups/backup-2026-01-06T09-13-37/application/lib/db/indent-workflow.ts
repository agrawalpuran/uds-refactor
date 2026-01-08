/**
 * Indent Workflow Data Access Functions
 * Handles complete indent → fulfillment → payment lifecycle
 */

import connectDB from './mongodb'
import mongoose from 'mongoose'
import IndentHeader from '../models/IndentHeader'
import VendorIndent from '../models/VendorIndent'
import OrderSuborder from '../models/OrderSuborder'
import GoodsReceiptNote from '../models/GoodsReceiptNote'
import VendorInvoice from '../models/VendorInvoice'
import Payment from '../models/Payment'
import Order from '../models/Order'
import Vendor from '../models/Vendor'
import Uniform from '../models/Uniform'
import { notifications } from '../utils/notifications'

// Helper function to convert Mongoose documents to plain objects
function toPlainObject(doc: any): any {
  if (!doc) return null
  if (Array.isArray(doc)) {
    return doc.map((d) => toPlainObject(d))
  }
  const obj = doc.toObject ? doc.toObject() : doc
  // Remove _id and __v, keep id if it exists
  const { _id, __v, ...rest } = obj
  return rest
}

/**
 * DERIVED MASTER ORDER STATUS (MANDATORY)
 * Master order status is ALWAYS derived from suborders, never manually set
 */
export async function deriveMasterOrderStatus(orderId: string | mongoose.Types.ObjectId): Promise<string> {
  await connectDB()
  
  const orderObjectId = typeof orderId === 'string' 
    ? new mongoose.Types.ObjectId(orderId) 
    : orderId
  
  // Find all suborders for this order
  const suborders = await OrderSuborder.find({ order_id: orderObjectId }).lean()
  
  if (!suborders || suborders.length === 0) {
    // No suborders exist - check if order has indent_id
    const order = await Order.findById(orderObjectId).lean()
    if (order && order.indent_id) {
      // Order is part of indent but no suborders created yet
      return 'Awaiting fulfilment'
    }
    // Legacy order without suborders
    return order?.status || 'Awaiting approval'
  }
  
  // Derive status from suborders
  const statuses = suborders.map(so => so.suborder_status || so.shipment_status || 'CREATED')
  
  // All suborders NOT_SHIPPED or CREATED
  if (statuses.every(s => s === 'NOT_SHIPPED' || s === 'CREATED')) {
    return 'Awaiting fulfilment'
  }
  
  // All suborders DELIVERED
  if (statuses.every(s => s === 'DELIVERED')) {
    return 'Delivered'
  }
  
  // Some shipped but not all delivered
  if (statuses.some(s => s === 'SHIPPED' || s === 'IN_TRANSIT' || s === 'DELIVERED')) {
    return 'Dispatched'
  }
  
  // Any failed or returned
  if (statuses.some(s => s === 'FAILED' || s === 'RETURNED')) {
    return 'Awaiting fulfilment' // Or could be a new status like 'Attention Required'
  }
  
  return 'Awaiting fulfilment'
}

/**
 * Update master order status (derived from suborders)
 */
export async function updateMasterOrderStatus(orderId: string | mongoose.Types.ObjectId): Promise<void> {
  await connectDB()
  
  const derivedStatus = await deriveMasterOrderStatus(orderId)
  
  // Try to find order by _id first, then by id field
  let orderObjectId: mongoose.Types.ObjectId | null = null
  
  if (typeof orderId === 'string') {
    // Try as ObjectId string first
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      orderObjectId = new mongoose.Types.ObjectId(orderId)
    } else {
      // Try to find by id field
      const order = await Order.findOne({ id: orderId }).lean()
      if (order && order._id) {
        orderObjectId = order._id
      }
    }
  } else {
    orderObjectId = orderId
  }
  
  if (!orderObjectId) {
    console.error(`[updateMasterOrderStatus] Could not resolve orderId: ${orderId}`)
    return
  }
  
  await Order.updateOne(
    { _id: orderObjectId },
    { $set: { status: derivedStatus } }
  )
}

/**
 * Create Indent Header
 */
export async function createIndentHeader(data: {
  client_indent_number: string
  indent_date: Date
  companyId: string | mongoose.Types.ObjectId
  site_id?: string | mongoose.Types.ObjectId
  created_by_user_id: string | mongoose.Types.ObjectId
  created_by_role: 'COMPANY_ADMIN' | 'SITE_ADMIN' | 'EMPLOYEE'
}): Promise<any> {
  await connectDB()
  
  // Generate unique ID
  const indentId = `IND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const indent = new IndentHeader({
    id: indentId,
    client_indent_number: data.client_indent_number,
    indent_date: data.indent_date,
    companyId: typeof data.companyId === 'string' 
      ? new mongoose.Types.ObjectId(data.companyId) 
      : data.companyId,
    site_id: data.site_id 
      ? (typeof data.site_id === 'string' 
          ? new mongoose.Types.ObjectId(data.site_id) 
          : data.site_id)
      : undefined,
    status: 'CREATED',
    created_by_user_id: typeof data.created_by_user_id === 'string'
      ? new mongoose.Types.ObjectId(data.created_by_user_id)
      : data.created_by_user_id,
    created_by_role: data.created_by_role,
  })
  
  await indent.save()
  
  // Trigger notification
  await notifications.indentCreated(
    indentId,
    indent.companyId.toString(),
    indent.created_by_user_id.toString()
  )
  
  return toPlainObject(indent)
}

/**
 * Create Vendor Indent
 */
export async function createVendorIndent(data: {
  indent_id: string | mongoose.Types.ObjectId
  vendor_id: string | mongoose.Types.ObjectId
  total_items: number
  total_quantity: number
  total_amount: number
}): Promise<any> {
  await connectDB()
  
  const vendorIndentId = `VI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const vendorIndent = new VendorIndent({
    id: vendorIndentId,
    indent_id: typeof data.indent_id === 'string'
      ? new mongoose.Types.ObjectId(data.indent_id)
      : data.indent_id,
    vendor_id: typeof data.vendor_id === 'string'
      ? new mongoose.Types.ObjectId(data.vendor_id)
      : data.vendor_id,
    status: 'CREATED',
    total_items: data.total_items,
    total_quantity: data.total_quantity,
    total_amount: data.total_amount,
  })
  
  await vendorIndent.save()
  return toPlainObject(vendorIndent)
}

/**
 * Create Order Suborder (one per vendor per order)
 */
export async function createOrderSuborder(data: {
  order_id: string | mongoose.Types.ObjectId
  vendor_id: string | mongoose.Types.ObjectId
  vendor_indent_id?: string | mongoose.Types.ObjectId
}): Promise<any> {
  await connectDB()
  
  // Resolve order_id to ObjectId
  let orderObjectId: mongoose.Types.ObjectId | null = null
  if (typeof data.order_id === 'string') {
    if (mongoose.Types.ObjectId.isValid(data.order_id)) {
      orderObjectId = new mongoose.Types.ObjectId(data.order_id)
    } else {
      // Find by id field
      const order = await Order.findOne({ id: data.order_id }).lean()
      if (order && order._id) {
        orderObjectId = order._id
      } else {
        throw new Error(`Order not found: ${data.order_id}`)
      }
    }
  } else {
    orderObjectId = data.order_id
  }
  
  // Check if suborder already exists for this order-vendor combination
  const existing = await OrderSuborder.findOne({
    order_id: orderObjectId,
    vendor_id: typeof data.vendor_id === 'string'
      ? new mongoose.Types.ObjectId(data.vendor_id)
      : data.vendor_id,
  }).lean()
  
  if (existing) {
    return toPlainObject(existing)
  }
  
  const suborderId = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const suborder = new OrderSuborder({
    id: suborderId,
    order_id: orderObjectId,
    vendor_id: typeof data.vendor_id === 'string'
      ? new mongoose.Types.ObjectId(data.vendor_id)
      : data.vendor_id,
    vendor_indent_id: data.vendor_indent_id
      ? (typeof data.vendor_indent_id === 'string'
          ? new mongoose.Types.ObjectId(data.vendor_indent_id)
          : data.vendor_indent_id)
      : undefined,
    suborder_status: 'CREATED',
    shipment_status: 'NOT_SHIPPED',
  })
  
  await suborder.save()
  
  // Update master order status
  await updateMasterOrderStatus(orderObjectId)
  
  return toPlainObject(suborder)
}

/**
 * Create suborders for an order based on its items and vendors
 * This is called when an order is created from an indent
 */
export async function createSubordersForOrder(orderId: string | mongoose.Types.ObjectId): Promise<any[]> {
  await connectDB()
  
  // Resolve order_id
  let orderObjectId: mongoose.Types.ObjectId | null = null
  if (typeof orderId === 'string') {
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      orderObjectId = new mongoose.Types.ObjectId(orderId)
    } else {
      const order = await Order.findOne({ id: orderId }).lean()
      if (order && order._id) {
        orderObjectId = order._id
      } else {
        throw new Error(`Order not found: ${orderId}`)
      }
    }
  } else {
    orderObjectId = orderId
  }
  
  const order = await Order.findById(orderObjectId).lean()
  if (!order) {
    throw new Error(`Order not found: ${orderId}`)
  }
  
  // Get unique vendors from order items
  // Note: This assumes order items have vendor information
  // If not, we need to look up vendors from products
  const vendorIds = new Set<string>()
  
  // For each item, find the vendor
  for (const item of order.items || []) {
    // Find product to get vendor
    const product = await Uniform.findOne({ id: item.productId }).lean()
    if (product && product.vendorId) {
      vendorIds.add(product.vendorId.toString())
    } else if (order.vendorId) {
      // Fallback to order's vendorId
      vendorIds.add(order.vendorId.toString())
    }
  }
  
  // If no vendors found, use order's vendorId
  if (vendorIds.size === 0 && order.vendorId) {
    vendorIds.add(order.vendorId.toString())
  }
  
  // Create suborder for each vendor
  const suborders = []
  for (const vendorId of vendorIds) {
    const suborder = await createOrderSuborder({
      order_id: orderObjectId,
      vendor_id: vendorId,
    })
    suborders.push(suborder)
  }
  
  return suborders
}

/**
 * Update Suborder Shipping & Tracking
 */
export async function updateSuborderShipping(data: {
  suborder_id: string | mongoose.Types.ObjectId
  shipper_name?: string
  consignment_number?: string
  shipping_date?: Date
  shipment_status?: 'NOT_SHIPPED' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED'
}): Promise<any> {
  await connectDB()
  
  // Try to find by id field first, then by _id
  let suborderObjectId: mongoose.Types.ObjectId | null = null
  
  if (typeof data.suborder_id === 'string') {
    // Try by id field first
    const suborderById = await OrderSuborder.findOne({ id: data.suborder_id }).lean()
    if (suborderById && suborderById._id) {
      suborderObjectId = suborderById._id
    } else if (mongoose.Types.ObjectId.isValid(data.suborder_id)) {
      suborderObjectId = new mongoose.Types.ObjectId(data.suborder_id)
    } else {
      throw new Error(`Suborder not found: ${data.suborder_id}`)
    }
  } else {
    suborderObjectId = data.suborder_id
  }
  
  const updateData: any = {
    last_status_updated_at: new Date(),
  }
  
  if (data.shipper_name !== undefined) updateData.shipper_name = data.shipper_name
  if (data.consignment_number !== undefined) updateData.consignment_number = data.consignment_number
  if (data.shipping_date !== undefined) updateData.shipping_date = data.shipping_date
  if (data.shipment_status !== undefined) {
    updateData.shipment_status = data.shipment_status
    // Sync suborder_status with shipment_status
    if (data.shipment_status === 'SHIPPED' || data.shipment_status === 'IN_TRANSIT') {
      updateData.suborder_status = 'SHIPPED'
    } else if (data.shipment_status === 'DELIVERED') {
      updateData.suborder_status = 'DELIVERED'
    } else if (data.shipment_status === 'FAILED' || data.shipment_status === 'RETURNED') {
      updateData.suborder_status = data.shipment_status
    }
  }
  
  const suborder = await OrderSuborder.findByIdAndUpdate(
    suborderObjectId,
    { $set: updateData },
    { new: true }
  ).lean()
  
  if (!suborder) {
    throw new Error('Suborder not found')
  }
  
  // Update master order status
  await updateMasterOrderStatus(suborder.order_id)
  
  // Trigger notification if shipped
  if (updateData.shipment_status === 'SHIPPED' || updateData.shipment_status === 'IN_TRANSIT') {
    await notifications.suborderShipped(
      suborder.id || suborder._id.toString(),
      suborder.order_id.toString(),
      suborder.vendor_id.toString(),
      updateData.consignment_number
    )
  } else if (updateData.shipment_status === 'DELIVERED') {
    await notifications.suborderDelivered(
      suborder.id || suborder._id.toString(),
      suborder.order_id.toString(),
      suborder.vendor_id.toString()
    )
  }
  
  return toPlainObject(suborder)
}

/**
 * Create Goods Receipt Note
 */
export async function createGRN(data: {
  vendor_indent_id: string | mongoose.Types.ObjectId
  vendor_id: string | mongoose.Types.ObjectId
  grn_number: string
  grn_date: Date
  remarks?: string
}): Promise<any> {
  await connectDB()
  
  const grnId = `GRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const grn = new GoodsReceiptNote({
    id: grnId,
    vendor_indent_id: typeof data.vendor_indent_id === 'string'
      ? new mongoose.Types.ObjectId(data.vendor_indent_id)
      : data.vendor_indent_id,
    vendor_id: typeof data.vendor_id === 'string'
      ? new mongoose.Types.ObjectId(data.vendor_id)
      : data.vendor_id,
    grn_number: data.grn_number,
    grn_date: data.grn_date,
    status: 'DRAFT',
    remarks: data.remarks,
  })
  
  await grn.save()
  return toPlainObject(grn)
}

/**
 * Submit GRN (updates vendor indent status)
 */
export async function submitGRN(grnId: string | mongoose.Types.ObjectId): Promise<any> {
  await connectDB()
  
  const grnObjectId = typeof grnId === 'string'
    ? new mongoose.Types.ObjectId(grnId)
    : grnId
  
  const grn = await GoodsReceiptNote.findByIdAndUpdate(
    grnObjectId,
    { $set: { status: 'SUBMITTED' } },
    { new: true }
  ).lean()
  
  if (!grn) {
    throw new Error('GRN not found')
  }
  
  // Update vendor indent status
  await VendorIndent.updateOne(
    { _id: grn.vendor_indent_id },
    { $set: { status: 'GRN_SUBMITTED' } }
  )
  
  // Trigger notification
  await notifications.grnSubmitted(
    grnId.toString(),
    grn.vendor_indent_id.toString(),
    grn.vendor_id.toString()
  )
  
  return toPlainObject(grn)
}

/**
 * Create Vendor Invoice
 */
export async function createVendorInvoice(data: {
  vendor_indent_id: string | mongoose.Types.ObjectId
  vendor_id: string | mongoose.Types.ObjectId
  invoice_number: string
  invoice_date: Date
  invoice_amount: number
}): Promise<any> {
  await connectDB()
  
  const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const invoice = new VendorInvoice({
    id: invoiceId,
    vendor_indent_id: typeof data.vendor_indent_id === 'string'
      ? new mongoose.Types.ObjectId(data.vendor_indent_id)
      : data.vendor_indent_id,
    vendor_id: typeof data.vendor_id === 'string'
      ? new mongoose.Types.ObjectId(data.vendor_id)
      : data.vendor_id,
    invoice_number: data.invoice_number,
    invoice_date: data.invoice_date,
    invoice_amount: data.invoice_amount,
    status: 'DRAFT',
  })
  
  await invoice.save()
  return toPlainObject(invoice)
}

/**
 * Submit Invoice (updates vendor indent status)
 */
export async function submitInvoice(invoiceId: string | mongoose.Types.ObjectId): Promise<any> {
  await connectDB()
  
  const invoiceObjectId = typeof invoiceId === 'string'
    ? new mongoose.Types.ObjectId(invoiceId)
    : invoiceId
  
  const invoice = await VendorInvoice.findByIdAndUpdate(
    invoiceObjectId,
    { $set: { status: 'SUBMITTED' } },
    { new: true }
  ).lean()
  
  if (!invoice) {
    throw new Error('Invoice not found')
  }
  
  // Trigger notification
  await notifications.invoiceSubmitted(
    invoiceId.toString(),
    invoice.vendor_indent_id.toString(),
    invoice.vendor_id.toString()
  )
  
  return toPlainObject(invoice)
}

/**
 * Create Payment
 */
export async function createPayment(data: {
  invoice_id: string | mongoose.Types.ObjectId
  vendor_id: string | mongoose.Types.ObjectId
  payment_reference: string
  payment_date: Date
  amount_paid: number
}): Promise<any> {
  await connectDB()
  
  const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const payment = new Payment({
    id: paymentId,
    invoice_id: typeof data.invoice_id === 'string'
      ? new mongoose.Types.ObjectId(data.invoice_id)
      : data.invoice_id,
    vendor_id: typeof data.vendor_id === 'string'
      ? new mongoose.Types.ObjectId(data.vendor_id)
      : data.vendor_id,
    payment_reference: data.payment_reference,
    payment_date: data.payment_date,
    amount_paid: data.amount_paid,
    status: 'PENDING',
  })
  
  await payment.save()
  return toPlainObject(payment)
}

/**
 * Complete Payment (updates invoice and vendor indent status)
 */
export async function completePayment(paymentId: string | mongoose.Types.ObjectId): Promise<any> {
  await connectDB()
  
  const paymentObjectId = typeof paymentId === 'string'
    ? new mongoose.Types.ObjectId(paymentId)
    : paymentId
  
  const payment = await Payment.findByIdAndUpdate(
    paymentObjectId,
    { $set: { status: 'COMPLETED' } },
    { new: true }
  ).lean()
  
  if (!payment) {
    throw new Error('Payment not found')
  }
  
  // Update invoice status
  await VendorInvoice.updateOne(
    { _id: payment.invoice_id },
    { $set: { status: 'PAID' } }
  )
  
  // Update vendor indent status
  const invoice = await VendorInvoice.findById(payment.invoice_id).lean()
  if (invoice) {
    await VendorIndent.updateOne(
      { _id: invoice.vendor_indent_id },
      { $set: { status: 'PAID' } }
    )
    
    // Get indent ID for notification
    const vendorIndent = await VendorIndent.findById(invoice.vendor_indent_id).lean()
    const indentId = vendorIndent?.indent_id?.toString()
    
    // Trigger payment notification
    await notifications.paymentCompleted(
      paymentId.toString(),
      payment.invoice_id.toString(),
      payment.vendor_id.toString(),
      indentId
    )
    
    // Check if indent can be closed
    const closed = await checkAndCloseIndent(invoice.vendor_indent_id)
    
    if (closed && indentId) {
      // Get company ID for notification
      const indent = await IndentHeader.findById(indentId).lean()
      if (indent) {
        await notifications.indentClosed(
          indentId,
          indent.companyId.toString()
        )
      }
    }
  }
  
  return toPlainObject(payment)
}

/**
 * Check and close indent if all conditions met
 */
export async function checkAndCloseIndent(vendorIndentId: string | mongoose.Types.ObjectId): Promise<boolean> {
  await connectDB()
  
  const vendorIndent = await VendorIndent.findById(vendorIndentId).lean()
  if (!vendorIndent) {
    return false
  }
  
  const indentId = vendorIndent.indent_id
  
  // Check all vendor indents are PAID
  const allVendorIndents = await VendorIndent.find({ indent_id: indentId }).lean()
  const allPaid = allVendorIndents.every(vi => vi.status === 'PAID')
  
  if (!allPaid) {
    return false
  }
  
  // Check all suborders are DELIVERED
  const vendorIndentIds = allVendorIndents.map(vi => vi._id)
  const allSuborders = await OrderSuborder.find({
    vendor_indent_id: { $in: vendorIndentIds }
  }).lean()
  
  const allDelivered = allSuborders.every(so => 
    so.suborder_status === 'DELIVERED' || so.shipment_status === 'DELIVERED'
  )
  
  if (!allDelivered) {
    return false
  }
  
  // Update indent status to CLOSED
  await IndentHeader.updateOne(
    { _id: indentId },
    { $set: { status: 'CLOSED' } }
  )
  
  return true
}

/**
 * Get Indent by ID
 */
export async function getIndentById(indentId: string | mongoose.Types.ObjectId): Promise<any | null> {
  await connectDB()
  
  const indent = await IndentHeader.findById(indentId)
    .populate('companyId', 'id name')
    .populate('site_id', 'id name')
    .populate('created_by_user_id', 'id employeeId firstName lastName email')
    .lean()
  
  return indent ? toPlainObject(indent) : null
}

/**
 * Get Vendor Indents by Indent ID
 */
export async function getVendorIndentsByIndentId(indentId: string | mongoose.Types.ObjectId): Promise<any[]> {
  await connectDB()
  
  const vendorIndents = await VendorIndent.find({
    indent_id: typeof indentId === 'string' 
      ? new mongoose.Types.ObjectId(indentId)
      : indentId
  })
    .populate('vendor_id', 'id name')
    .lean()
  
  return vendorIndents.map(vi => toPlainObject(vi))
}

/**
 * Get Suborders by Order ID
 */
export async function getSubordersByOrderId(orderId: string | mongoose.Types.ObjectId): Promise<any[]> {
  await connectDB()
  
  const suborders = await OrderSuborder.find({
    order_id: typeof orderId === 'string'
      ? new mongoose.Types.ObjectId(orderId)
      : orderId
  })
    .populate('vendor_id', 'id name')
    .populate('vendor_indent_id', 'id status')
    .lean()
  
  return suborders.map(so => toPlainObject(so))
}

/**
 * Get Suborders by Vendor ID (for vendor access)
 */
export async function getSubordersByVendorId(vendorId: string | mongoose.Types.ObjectId): Promise<any[]> {
  await connectDB()
  
  const suborders = await OrderSuborder.find({
    vendor_id: typeof vendorId === 'string'
      ? new mongoose.Types.ObjectId(vendorId)
      : vendorId
  })
    .populate('order_id', 'id employeeName orderDate')
    .populate('vendor_indent_id', 'id status')
    .lean()
  
  return suborders.map(so => toPlainObject(so))
}

