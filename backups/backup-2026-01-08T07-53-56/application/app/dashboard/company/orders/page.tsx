'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Search, Filter, Eye } from 'lucide-react'
import { getOrdersByCompany, getCompanyById, getLocationByAdminEmail, getOrdersByLocation } from '@/lib/data-mongodb'
// Data masking removed for Company Admin - they should see all employee information unmasked

export default function CompanyOrdersPage() {
  const [companyId, setCompanyId] = useState<string>('')
  const [companyOrders, setCompanyOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companyPrimaryColor, setCompanyPrimaryColor] = useState<string>('#f76b1c')
  const [companySecondaryColor, setCompanySecondaryColor] = useState<string>('#f76b1c')
  const [isLocationAdmin, setIsLocationAdmin] = useState<boolean>(false)
  const [locationInfo, setLocationInfo] = useState<any>(null)
  
  // Get company ID from localStorage (set during login) - company admin is linked to only one company
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadData = async () => {
        try {
          setLoading(true)
          const storedCompanyId = localStorage.getItem('companyId')
          // CRITICAL SECURITY FIX: Use only tab-specific auth storage
          const { getUserEmail } = await import('@/lib/utils/auth-storage')
          const userEmail = getUserEmail('company')
          
          // Check if user is Location Admin
          let locationAdminLocation = null
          if (userEmail) {
            locationAdminLocation = await getLocationByAdminEmail(userEmail)
            const isLocationAdminUser = !!locationAdminLocation
            setIsLocationAdmin(isLocationAdminUser)
            setLocationInfo(locationAdminLocation)
            
            if (isLocationAdminUser && locationAdminLocation) {
              // Location Admin: Get orders for their location only
              const locationId = locationAdminLocation.id || locationAdminLocation._id?.toString()
              if (locationId) {
                const locationOrders = await getOrdersByLocation(locationId)
                setCompanyOrders(locationOrders)
                
                // Get company for colors
                const targetCompanyId = locationAdminLocation.companyId?.id || locationAdminLocation.companyId || storedCompanyId
                if (targetCompanyId) {
                  setCompanyId(targetCompanyId)
                  const companyDetails = await getCompanyById(targetCompanyId)
                  if (companyDetails) {
                    setCompanyPrimaryColor(companyDetails.primaryColor || '#f76b1c')
                    setCompanySecondaryColor(companyDetails.secondaryColor || companyDetails.primaryColor || '#f76b1c')
                  }
                }
                return // Exit early for Location Admin
              }
            }
          }
          
          if (storedCompanyId) {
            // Company Admin: Get all orders for company
            setCompanyId(storedCompanyId)
            const filtered = await getOrdersByCompany(storedCompanyId)
            // Debug: Log first order to check vendor information
            if (filtered.length > 0) {
              console.log('[OrderHistory] First order sample:', {
                id: filtered[0].id,
                vendorName: filtered[0].vendorName,
                vendorId: filtered[0].vendorId,
                vendorIdType: typeof filtered[0].vendorId,
                vendorIdKeys: filtered[0].vendorId && typeof filtered[0].vendorId === 'object' ? Object.keys(filtered[0].vendorId) : 'N/A'
              })
            }
            setCompanyOrders(filtered)
            
            // Fetch company colors
            const companyDetails = await getCompanyById(storedCompanyId)
            if (companyDetails) {
              setCompanyPrimaryColor(companyDetails.primaryColor || '#f76b1c')
              setCompanySecondaryColor(companyDetails.secondaryColor || companyDetails.primaryColor || '#f76b1c')
            }
          }
        } catch (error) {
          console.error('Error loading orders:', error)
        } finally {
          setLoading(false)
        }
      }
      
      loadData()
    }
  }, [])

  return (
    <DashboardLayout actorType="company">
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <button 
            onClick={() => {
              window.location.href = '/dashboard/company/batch-upload'
            }}
            className="text-white px-4 py-2 rounded-lg font-semibold transition-colors hover:opacity-90"
            style={{ backgroundColor: companyPrimaryColor || '#f76b1c' }}
            onMouseEnter={(e) => {
              const color = companyPrimaryColor || '#f76b1c'
              const r = parseInt(color.slice(1, 3), 16)
              const g = parseInt(color.slice(3, 5), 16)
              const b = parseInt(color.slice(5, 7), 16)
              const darker = `#${Math.max(0, r - 25).toString(16).padStart(2, '0')}${Math.max(0, g - 25).toString(16).padStart(2, '0')}${Math.max(0, b - 25).toString(16).padStart(2, '0')}`
              e.currentTarget.style.backgroundColor = darker
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = companyPrimaryColor || '#f76b1c'
            }}
          >
            Place Bulk Order
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
                style={{ 
                  '--tw-ring-color': companyPrimaryColor || '#f76b1c',
                  '--tw-border-color': companyPrimaryColor || '#f76b1c'
                } as React.CSSProperties & { '--tw-ring-color'?: string; '--tw-border-color'?: string }}
                onFocus={(e) => {
                  e.target.style.borderColor = companyPrimaryColor || '#f76b1c'
                  e.target.style.boxShadow = `0 0 0 2px ${companyPrimaryColor || '#f76b1c'}40`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
              style={{ 
                '--tw-ring-color': companyPrimaryColor || '#f76b1c',
                '--tw-border-color': companyPrimaryColor || '#f76b1c'
              } as React.CSSProperties & { '--tw-ring-color'?: string; '--tw-border-color'?: string }}
              onFocus={(e) => {
                e.target.style.borderColor = companyPrimaryColor || '#f76b1c'
                e.target.style.boxShadow = `0 0 0 2px ${companyPrimaryColor || '#f76b1c'}40`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
              style={{ 
                '--tw-ring-color': companyPrimaryColor || '#f76b1c',
                '--tw-border-color': companyPrimaryColor || '#f76b1c'
              } as React.CSSProperties & { '--tw-ring-color'?: string; '--tw-border-color'?: string }}
              onFocus={(e) => {
                e.target.style.borderColor = companyPrimaryColor || '#f76b1c'
                e.target.style.boxShadow = `0 0 0 2px ${companyPrimaryColor || '#f76b1c'}40`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="all">All Locations</option>
              <option value="new-york">New York Office</option>
              <option value="san-francisco">San Francisco Office</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Order ID</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Employee</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Items</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Total</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Payment Type</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Dispatch Location</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Date</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Status</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companyOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No orders found for your company
                    </td>
                  </tr>
                ) : (
                  companyOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900 font-medium">{order.id}</td>
                    <td className="py-4 px-6 text-gray-600">{order.employeeName || 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-600">
                      <div className="space-y-0.5">
                        {order.items.map((item: any, idx: number) => {
                          // Extract vendor name - handle multiple possible formats after toPlainObject transformation
                          let vendorName = 'N/A'
                          
                          // Try vendorName field first (stored directly on order)
                          if (order.vendorName && typeof order.vendorName === 'string') {
                            vendorName = order.vendorName
                          } 
                          // Try populated vendorId object (after toPlainObject, populated fields become objects)
                          else if (order.vendorId) {
                            if (typeof order.vendorId === 'object' && order.vendorId !== null) {
                              // Populated vendorId: could have name, id, or _id fields
                              vendorName = order.vendorId.name || order.vendorId.id || 'N/A'
                            } else if (typeof order.vendorId === 'string') {
                              // If it's just an ObjectId string, vendorName should have been set during order creation
                              // But if not, we'll show N/A
                              vendorName = 'N/A'
                            }
                          }
                          
                          // Debug logging (remove after verification)
                          if (idx === 0 && vendorName === 'N/A') {
                            console.log('[OrderHistory] Vendor name extraction failed:', {
                              orderId: order.id,
                              vendorName: order.vendorName,
                              vendorId: order.vendorId,
                              vendorIdType: typeof order.vendorId,
                              vendorIdKeys: order.vendorId && typeof order.vendorId === 'object' ? Object.keys(order.vendorId) : 'N/A'
                            })
                          }
                          
                          return (
                            <div key={idx} className="text-xs leading-snug">
                              <span className="font-medium text-gray-900">{item.uniformName}</span>
                              {vendorName !== 'N/A' && (
                                <span className="text-gray-500"> • {vendorName}</span>
                              )}
                              <span className="text-gray-600"> • Size: {item.size}</span>
                              <span className="text-gray-600"> • Qty: {item.quantity}</span>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900 font-semibold">₹{order.total.toFixed(2)}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {order.isPersonalPayment ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          Personal Payment
                          {order.personalPaymentAmount && ` (₹${parseFloat(order.personalPaymentAmount).toFixed(2)})`}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Company Paid
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{order.dispatchLocation}</td>
                    <td className="py-4 px-6 text-gray-600">{order.orderDate}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button className="text-blue-600 hover:text-blue-700">
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}








