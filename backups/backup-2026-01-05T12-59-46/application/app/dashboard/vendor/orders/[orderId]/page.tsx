'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, Package, Truck, MapPin, Calendar, DollarSign, User, Building, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { maskEmployeeName, maskAddress } from '@/lib/utils/data-masking'

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.orderId as string

  const [order, setOrder] = useState<any>(null)
  const [shipment, setShipment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      loadOrderDetails()
    }
  }, [orderId])

  const loadOrderDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get vendor ID for authorization
      const { getVendorId, getAuthData } = typeof window !== 'undefined'
        ? await import('@/lib/utils/auth-storage')
        : { getVendorId: () => null, getAuthData: () => null }

      let storedVendorId = getVendorId() || getAuthData('vendor')?.vendorId || null
      if (!storedVendorId) {
        storedVendorId = typeof window !== 'undefined' ? localStorage.getItem('vendorId') : null
      }

      if (!storedVendorId) {
        throw new Error('Vendor ID not found. Please log in again.')
      }

      // Fetch order details
      const response = await fetch(`/api/vendor/orders/${orderId}?vendorId=${storedVendorId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || 'Failed to load order details')
      }

      const data = await response.json()
      setOrder(data.order)
      setShipment(data.shipment || null)
    } catch (err: any) {
      console.error('Error loading order details:', err)
      setError(err.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'Dispatched':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Awaiting fulfilment':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'Awaiting approval':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getShipmentStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'CREATED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'FAILED':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Order not found</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <p className="text-sm text-gray-600">Order #{order.id}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Order Information</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Order ID</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{order.id}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Order Date</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(order.orderDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {order.pr_number && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">PR Number</label>
                    <p className="text-sm font-medium text-blue-600 mt-1">{order.pr_number}</p>
                  </div>
                )}
                {order.poNumbers && order.poNumbers.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">PO Number(s)</label>
                    <p className="text-sm font-medium text-green-600 mt-1">{order.poNumbers.join(', ')}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500">Total Amount</label>
                  <p className="text-sm font-bold text-gray-900 mt-1">₹{order.total.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Dispatch Location</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{order.dispatchLocation || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
              </div>
              <div className="space-y-3">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">{item.uniformName}</h3>
                        <p className="text-xs text-gray-600 mt-1">Size: {item.size}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-gray-600">₹{item.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                    </div>
                    {(item.dispatchedQuantity !== undefined || item.deliveredQuantity !== undefined || item.itemShipmentStatus) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-gray-500">Ordered</label>
                          <p className="font-medium text-gray-900">{item.quantity}</p>
                        </div>
                        <div>
                          <label className="text-gray-500">Dispatched</label>
                          <p className="font-medium text-blue-600">{item.dispatchedQuantity || 0}</p>
                        </div>
                        <div>
                          <label className="text-gray-500">Delivered</label>
                          <p className="font-medium text-green-600">{item.deliveredQuantity || 0}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
              </div>
              <div className="space-y-1 text-sm text-gray-700">
                {order.shipping_address_line_1 && (
                  <p>{maskAddress(order.shipping_address_line_1)}</p>
                )}
                {order.shipping_address_line_2 && (
                  <p>{maskAddress(order.shipping_address_line_2)}</p>
                )}
                {order.shipping_address_line_3 && (
                  <p>{maskAddress(order.shipping_address_line_3)}</p>
                )}
                <p>
                  {order.shipping_city}
                  {order.shipping_state && `, ${order.shipping_state}`}
                  {order.shipping_pincode && ` - ${order.shipping_pincode}`}
                </p>
                {order.shipping_country && (
                  <p>{order.shipping_country}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Employee Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Employee</h2>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{maskEmployeeName(order.employeeName || 'N/A')}</p>
                </div>
                {order.employeeIdNum && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Employee ID</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{order.employeeIdNum}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Company Information */}
            {order.companyId && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Company</h2>
                </div>
                <div className="space-y-2">
                  {typeof order.companyId === 'object' && order.companyId?.name ? (
                    <p className="text-sm font-medium text-gray-900">{order.companyId.name}</p>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">Company ID: {order.companyIdNum || 'N/A'}</p>
                  )}
                </div>
              </div>
            )}

            {/* Shipment Information */}
            {(order.dispatchStatus === 'SHIPPED' || shipment) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Shipment Details</h2>
                </div>
                <div className="space-y-4">
                  {shipment && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Shipment Status</label>
                      <div className="mt-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getShipmentStatusColor(shipment.shipmentStatus)}`}>
                          {shipment.shipmentStatus}
                        </span>
                      </div>
                    </div>
                  )}
                  {order.shipmentId && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Shipment ID</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{order.shipmentId}</p>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Tracking Number</label>
                      <p className="text-sm font-medium text-blue-600 mt-1 break-all">{order.trackingNumber}</p>
                      {order.logisticsTrackingUrl && (
                        <a
                          href={order.logisticsTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Track Shipment →
                        </a>
                      )}
                    </div>
                  )}
                  {order.carrierName && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Carrier</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{order.carrierName}</p>
                    </div>
                  )}
                  {order.modeOfTransport && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Mode of Transport</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{order.modeOfTransport}</p>
                    </div>
                  )}
                  {order.dispatchedDate && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Dispatched Date</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {new Date(order.dispatchedDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {order.expectedDeliveryDate && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Expected Delivery</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {order.deliveredDate && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Delivered Date</label>
                      <p className="text-sm font-medium text-green-600 mt-1">
                        {new Date(order.deliveredDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {order.receivedBy && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Received By</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{order.receivedBy}</p>
                    </div>
                  )}
                  {shipment?.shippingCost && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Shipping Cost</label>
                      <p className="text-sm font-bold text-gray-900 mt-1">₹{shipment.shippingCost.toFixed(2)}</p>
                    </div>
                  )}
                  {shipment?.warehouseRefId && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Warehouse</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{shipment.warehouseRefId}</p>
                    </div>
                  )}
                  {shipment?.shipmentPackageId && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Package</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{shipment.shipmentPackageId}</p>
                    </div>
                  )}
                  {shipment && (shipment.lengthCm || shipment.breadthCm || shipment.heightCm) && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Dimensions</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {shipment.lengthCm} × {shipment.breadthCm} × {shipment.heightCm} cm
                      </p>
                    </div>
                  )}
                  {shipment?.volumetricWeight && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Volumetric Weight</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{shipment.volumetricWeight.toFixed(2)} kg</p>
                    </div>
                  )}
                  {shipment?.providerShipmentReference && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Provider Reference</label>
                      <p className="text-sm font-medium text-gray-900 mt-1 break-all">{shipment.providerShipmentReference}</p>
                    </div>
                  )}
                  {order.deliveryRemarks && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Delivery Remarks</label>
                      <p className="text-sm text-gray-700 mt-1">{order.deliveryRemarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

