'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { Search, CheckCircle, XCircle, Package, Truck, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getOrdersByVendor, updateOrderStatus } from '@/lib/data-mongodb'
import { maskEmployeeName, maskAddress } from '@/lib/utils/data-masking'

export default function VendorReplacementOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    orderId: string | null
    action: 'shipped' | 'delivered' | null
  }>({ show: false, orderId: null, action: null })

  const loadOrders = async () => {
    try {
      setLoading(true)
      // CRITICAL FIX: Prioritize sessionStorage (from current login) over localStorage (may be stale)
      const { getVendorId, getAuthData } = typeof window !== 'undefined' 
        ? await import('@/lib/utils/auth-storage') 
        : { getVendorId: () => null, getAuthData: () => null }
      
      // Try sessionStorage first (from current login) - MOST RELIABLE
      let storedVendorId = getVendorId() || getAuthData('vendor')?.vendorId || null
      
      // Fallback to localStorage (may be stale)
      if (!storedVendorId) {
        storedVendorId = typeof window !== 'undefined' ? localStorage.getItem('vendorId') : null
      }
      
      console.log('[ReplacementOrders] VendorId resolved:', storedVendorId)
      
      if (storedVendorId) {
        // Load only replacement orders for this vendor
        const vendorOrders = await getOrdersByVendor(storedVendorId)
        // Filter for replacement orders only
        const replacementOrders = vendorOrders.filter((order: any) => order.orderType === 'REPLACEMENT')
        console.log('Loaded replacement orders:', replacementOrders.length)
        setOrders(replacementOrders)
      } else {
        console.warn('No vendor ID found')
        setOrders([])
      }
    } catch (error) {
      console.error('Error loading replacement orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMarkAsShipped = (orderId: string) => {
    setConfirmDialog({ show: true, orderId, action: 'shipped' })
  }

  const handleMarkAsDelivered = (orderId: string) => {
    setConfirmDialog({ show: true, orderId, action: 'delivered' })
  }

  const handleConfirm = async () => {
    if (!confirmDialog.orderId || !confirmDialog.action) return

    try {
      const newStatus = confirmDialog.action === 'shipped' ? 'Dispatched' : 'Delivered'
      console.log(`[Frontend] 🚀 Marking replacement order as ${newStatus}:`, {
        orderId: confirmDialog.orderId,
        action: confirmDialog.action,
        newStatus,
        timestamp: new Date().toISOString()
      })
      
      // CRITICAL SECURITY: Get vendorId from localStorage for authorization
      const storedVendorId = typeof window !== 'undefined' ? localStorage.getItem('vendorId') : null
      if (!storedVendorId) {
        throw new Error('Vendor ID not found. Please log in again.')
      }
      
      const result = await updateOrderStatus(confirmDialog.orderId, newStatus, storedVendorId)
      console.log(`[Frontend] ✅ Replacement order status updated successfully:`, {
        orderId: confirmDialog.orderId,
        result: result?.id || result?.status || 'N/A'
      })
      
      // Reload orders to get updated data
      await loadOrders()
      
      setConfirmDialog({ show: false, orderId: null, action: null })
    } catch (error: any) {
      console.error(`[Frontend] ❌ Error updating replacement order status:`, error)
      alert(`Failed to update order status: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleCancel = () => {
    setConfirmDialog({ show: false, orderId: null, action: null })
  }

  return (
    <DashboardLayout actorType="vendor">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Replacement Orders</h1>
            <p className="text-gray-600 mt-2">View and fulfill replacement orders for returned items</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search replacement orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Orders */}
        {loading ? (
          <p className="text-gray-600 text-center py-8">Loading replacement orders...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <RefreshCw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Replacement Orders</h2>
            <p className="text-gray-600">
              {searchTerm 
                ? 'No replacement orders match your search criteria.'
                : 'You have no replacement orders at this time.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500 border border-gray-200 hover:shadow-xl transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 truncate">#{order.id}</h3>
                    <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                      Replacement Order
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">Employee: {maskEmployeeName(order.employeeName || 'N/A')}</p>
                  <p className="text-xs text-gray-600 truncate">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                  {order.returnRequestId && (
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">Return: #{order.returnRequestId}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                  order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'Dispatched' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'Awaiting fulfilment' ? 'bg-purple-100 text-purple-700' :
                  order.status === 'Awaiting approval' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="border-t pt-3 mb-3">
                <h4 className="text-xs font-semibold text-gray-900 mb-1.5">Replacement Items:</h4>
                <div className="space-y-1.5">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-green-50 p-2 rounded">
                      <span className="text-gray-700 flex-1 min-w-0 truncate pr-2">
                        {item.uniformName} (Size: {item.size}) x {item.quantity}
                      </span>
                      <span className="text-gray-900 font-medium whitespace-nowrap shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between items-center gap-2">
                  <span className="text-xs text-gray-600 truncate">Dispatch: {order.dispatchLocation}</span>
                  <span className="text-sm font-bold text-gray-900 whitespace-nowrap shrink-0">Total: ₹{order.total.toFixed(2)}</span>
                </div>
                {order.deliveryAddress && (
                  <div className="mt-1.5">
                    <p className="text-[10px] text-gray-600">Delivery Address:</p>
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{maskAddress(order.deliveryAddress)}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-auto pt-3">
                {/* Show "Mark as Shipped" for orders that are not yet Dispatched or Delivered */}
                {(order.status === 'Awaiting approval' || order.status === 'Awaiting fulfilment') && (
                  <button 
                    onClick={() => handleMarkAsShipped(order.id)}
                    className="flex-1 bg-green-600 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Truck className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Mark as Shipped</span>
                  </button>
                )}
                {/* Show "Mark as Delivered" for orders that are Dispatched but not Delivered */}
                {order.status === 'Dispatched' && (
                  <button 
                    onClick={() => handleMarkAsDelivered(order.id)}
                    className="flex-1 bg-blue-600 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Mark as Delivered</span>
                  </button>
                )}
                {/* Show "Delivered" badge for completed orders */}
                {order.status === 'Delivered' && (
                  <div className="flex-1 bg-gray-100 text-gray-600 px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Delivered</span>
                  </div>
                )}
                <button className="flex-1 bg-gray-200 text-gray-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-gray-300 transition-colors truncate">
                  View Details
                </button>
              </div>
            </div>
            ))}
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Action</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to mark this replacement order as {confirmDialog.action === 'shipped' ? 'shipped' : 'delivered'}?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 text-white py-3 rounded-lg font-semibold transition-colors ${
                    confirmDialog.action === 'shipped' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

