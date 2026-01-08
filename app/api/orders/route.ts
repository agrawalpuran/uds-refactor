import { NextResponse } from 'next/server'
import { 
  getAllOrders, 
  getOrdersByCompany, 
  getOrdersByEmployee,
  getOrdersByVendor,
  getOrdersByLocation,
  createOrder, 
  getConsumedEligibility,
  approveOrder,
  bulkApproveOrders,
  updateOrderStatus,
  getPendingApprovals,
  getPendingApprovalCount
} from '@/lib/db/data-access'
// Ensure models are registered before use (order matters for dependencies)
import '@/lib/models/ProductCategory' // Must be loaded before Subcategory
import '@/lib/models/Category' // Must be loaded before Subcategory (Subcategory references it)
import '@/lib/models/Subcategory' // Depends on Category


// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const employeeId = searchParams.get('employeeId')
    const vendorId = searchParams.get('vendorId')
    const locationId = searchParams.get('locationId')
    const consumedEligibility = searchParams.get('consumedEligibility')
    const pendingApprovals = searchParams.get('pendingApprovals')
    const pendingApprovalCount = searchParams.get('pendingApprovalCount')
    const pendingSiteAdminApprovals = searchParams.get('pendingSiteAdminApprovals')
    const adminEmail = searchParams.get('adminEmail')

    // Get pending site admin approvals
    if (pendingSiteAdminApprovals === 'true' && adminEmail) {
      const { getPendingApprovalsForSiteAdmin } = await import('@/lib/db/data-access')
      const fromDateParam = searchParams.get('fromDate')
      const toDateParam = searchParams.get('toDate')
      const fromDate = fromDateParam ? new Date(fromDateParam) : undefined
      const toDate = toDateParam ? new Date(toDateParam) : undefined
      const orders = await getPendingApprovalsForSiteAdmin(adminEmail, fromDate, toDate)
      return NextResponse.json(orders)
    }

    // Get approved PRs for site admin
    const approvedPRs = searchParams.get('approvedPRs')
    if (approvedPRs === 'true' && adminEmail) {
      const { getApprovedPRsForSiteAdmin } = await import('@/lib/db/data-access')
      const fromDateParam = searchParams.get('fromDate')
      const toDateParam = searchParams.get('toDate')
      const fromDate = fromDateParam ? new Date(fromDateParam) : undefined
      const toDate = toDateParam ? new Date(toDateParam) : undefined
      const orders = await getApprovedPRsForSiteAdmin(adminEmail, fromDate, toDate)
      return NextResponse.json(orders)
    }

    // Get all PRs for site admin (historical view - all statuses)
    const allPRsForSiteAdmin = searchParams.get('allPRsForSiteAdmin')
    if (allPRsForSiteAdmin === 'true' && adminEmail) {
      const { getAllPRsForSiteAdmin } = await import('@/lib/db/data-access')
      const fromDateParam = searchParams.get('fromDate')
      const toDateParam = searchParams.get('toDate')
      const fromDate = fromDateParam ? new Date(fromDateParam) : undefined
      const toDate = toDateParam ? new Date(toDateParam) : undefined
      const orders = await getAllPRsForSiteAdmin(adminEmail, fromDate, toDate)
      return NextResponse.json(orders)
    }

    // Get approved orders for company admin
    const approvedCompanyAdmin = searchParams.get('approvedCompanyAdmin')
    if (approvedCompanyAdmin === 'true' && companyId) {
      const { getApprovedOrdersForCompanyAdmin } = await import('@/lib/db/data-access')
      const orders = await getApprovedOrdersForCompanyAdmin(companyId)
      return NextResponse.json(orders)
    }

    // Get PO created orders for company admin
    const poCreatedCompanyAdmin = searchParams.get('poCreatedCompanyAdmin')
    if (poCreatedCompanyAdmin === 'true' && companyId) {
      const { getPOCreatedOrdersForCompanyAdmin } = await import('@/lib/db/data-access')
      const orders = await getPOCreatedOrdersForCompanyAdmin(companyId)
      return NextResponse.json(orders)
    }

    // Get pending approval count
    if (pendingApprovalCount === 'true' && companyId) {
      const count = await getPendingApprovalCount(companyId)
      return NextResponse.json({ count })
    }

    // Get pending approvals
    if (pendingApprovals === 'true' && companyId) {
      const orders = await getPendingApprovals(companyId)
      return NextResponse.json(orders)
    }

    // Return consumed eligibility for an employee
    if (consumedEligibility === 'true' && employeeId) {
      const consumed = await getConsumedEligibility(employeeId)
      return NextResponse.json(consumed)
    }

    // Get orders by location (for Location Admin)
    if (locationId) {
      const orders = await getOrdersByLocation(locationId)
      return NextResponse.json(orders)
    }

    // Get orders by vendor (for vendor dashboard)
    if (vendorId) {
      const orders = await getOrdersByVendor(vendorId)
      return NextResponse.json(orders)
    }

    if (companyId) {
      const orders = await getOrdersByCompany(companyId)
      return NextResponse.json(orders)
    }

    if (employeeId) {
      const orders = await getOrdersByEmployee(employeeId)
      return NextResponse.json(orders)
    }

    const orders = await getAllOrders()
    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('API Error in /api/orders GET:', error)
    console.error('Error stack:', error.stack)
    
    const errorMessage = error.message || 'Unknown error occurred'
    const isConnectionError = errorMessage.includes('Mongo') || errorMessage.includes('connection')
    
    return NextResponse.json({ 
      error: errorMessage,
      type: isConnectionError ? 'database_connection_error' : 'api_error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: any = null
  try {
    body = await request.json()
    const { action, orderId, orderIds, adminEmail, status } = body

    // Bulk approve orders
    if (action === 'bulkApprove' && orderIds && Array.isArray(orderIds) && adminEmail) {
      // Extract PR data map from request body
      const prDataArray = body.prDataArray || [] // Array of { orderId, prNumber, prDate }
      const prDataMap = new Map<string, { prNumber: string, prDate: Date }>()
      
      for (const prData of prDataArray) {
        if (prData.orderId && prData.prNumber && prData.prDate) {
          prDataMap.set(prData.orderId, {
            prNumber: prData.prNumber,
            prDate: new Date(prData.prDate)
          })
        }
      }
      
      const result = await bulkApproveOrders(orderIds, adminEmail, prDataMap.size > 0 ? prDataMap : undefined)
      return NextResponse.json(result, { status: 200 })
    }

    // Approve order
    if (action === 'approve' && orderId && adminEmail) {
      const prNumber = body.prNumber // Optional PR number from site admin
      const prDate = body.prDate ? new Date(body.prDate) : undefined // Optional PR date from site admin
      const order = await approveOrder(orderId, adminEmail, prNumber, prDate)
      return NextResponse.json(order, { status: 200 })
    }

    // Update order status
    if (action === 'updateStatus' && orderId && status) {
      const vendorId = body.vendorId // CRITICAL SECURITY: Extract vendorId from request for authorization
      console.log(`[API] 📦 updateOrderStatus called: orderId=${orderId}, status=${status}, vendorId=${vendorId || 'N/A'}`)
      console.log(`[API] 📦 Request timestamp: ${new Date().toISOString()}`)
      
      // CRITICAL SECURITY: If vendorId is provided, validate authorization
      // This ensures vendors can ONLY update orders that belong to them
      if (vendorId) {
        console.log(`[API] 🔒 Vendor authorization check enabled for vendorId: ${vendorId}`)
      } else {
        console.warn(`[API] ⚠️ No vendorId provided in request - authorization check will be skipped`)
        console.warn(`[API] ⚠️ This should only happen for admin/system updates, not vendor updates`)
      }
      
      try {
        const order = await updateOrderStatus(orderId, status, vendorId)
        console.log(`[API] ✅ updateOrderStatus completed successfully for orderId=${orderId}`)
        return NextResponse.json(order, { status: 200 })
      } catch (error: any) {
        console.error(`[API] ❌ updateOrderStatus failed for orderId=${orderId}:`, error)
        console.error(`[API] ❌ Error details:`, {
          message: error?.message,
          stack: error?.stack,
          name: error?.name
        })
        
        // Return 403 Forbidden for authorization failures
        if (error?.message?.includes('Authorization failed') || error?.message?.includes('permission')) {
          return NextResponse.json({ 
            error: error.message,
            type: 'authorization_error'
          }, { status: 403 })
        }
        
        throw error
      }
    }

    // Create new order
    console.log('API /api/orders POST: Creating order with data:', {
      employeeId: body.employeeId,
      itemsCount: body.items?.length || 0,
      items: body.items?.map((i: any) => ({ uniformId: i.uniformId, uniformName: i.uniformName }))
    })
    
    const order = await createOrder(body)
    console.log('API /api/orders POST: Order created successfully:', order.id || order.parentOrderId)
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('API Error in /api/orders POST:', error)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('Request body:', body ? JSON.stringify(body, null, 2) : 'Could not parse request body')
    
    // Extract error message more reliably
    let errorMessage = 'Unknown error occurred'
    if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error?.toString) {
      errorMessage = error.toString()
    }
    
    const isConnectionError = errorMessage.includes('Mongo') || errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')
    const isVendorError = errorMessage.includes('vendor') || errorMessage.includes('Vendor') || errorMessage.includes('No vendor found')
    const isNotFoundError = errorMessage.includes('not found') || errorMessage.includes('Not found')
    
    // Return appropriate status code based on error type
    let statusCode = 500
    if (isConnectionError) {
      statusCode = 503 // Service Unavailable
    } else if (isVendorError || isNotFoundError) {
      statusCode = 400 // Bad Request
    }
    
    console.error('Returning error response:', {
      errorMessage,
      statusCode,
      type: isConnectionError ? 'database_connection_error' : (isVendorError ? 'vendor_configuration_error' : 'api_error')
    })
    
    return NextResponse.json({ 
      error: errorMessage,
      type: isConnectionError ? 'database_connection_error' : (isVendorError ? 'vendor_configuration_error' : 'api_error'),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: statusCode })
  }
}

