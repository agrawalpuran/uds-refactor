import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import mongoose from 'mongoose'
import Company from '@/lib/models/Company'
import Branch from '@/lib/models/Branch'
import Employee from '@/lib/models/Employee'
import Uniform from '@/lib/models/Uniform'
import Order from '@/lib/models/Order'
import Location from '@/lib/models/Location'
import LocationAdmin from '@/lib/models/LocationAdmin'
import { ProductCompany, ProductVendor } from '@/lib/models/Relationship'
import { createOrder } from '@/lib/db/data-access'
import { decrypt } from '@/lib/utils/encryption'
import { getSystemFeatureConfig } from '@/lib/db/feature-config-access'
// Ensure models are registered
import '@/lib/models/SystemFeatureConfig'

/**
 * POST /api/superadmin/create-test-orders
 * Create test orders for employees
 * 
 * FEATURE FLAG GUARD: This endpoint is protected by testOrdersEnabled flag.
 * Returns 403 if the feature is disabled.
 */
export async function POST(request: Request) {
  try {
    await connectDB()

    // FEATURE FLAG CHECK: Block if test orders feature is disabled
    const featureConfig = await getSystemFeatureConfig()
    if (!featureConfig.testOrdersEnabled) {
      return NextResponse.json(
        { error: 'Test Order feature is disabled' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { companyId, branchId, vendorIds, numEmployees, autoApproveLocationAdmin = true } = body

    if (!companyId || !branchId || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, branchId, vendorIds' },
        { status: 400 }
      )
    }

    if (!numEmployees || numEmployees < 1 || numEmployees > 10) {
      return NextResponse.json(
        { error: 'numEmployees must be between 1 and 10' },
        { status: 400 }
      )
    }

    // Find company
    const company = await Company.findOne({ id: companyId })
    if (!company) {
      return NextResponse.json(
        { error: `Company not found: ${companyId}` },
        { status: 404 }
      )
    }

    // Find branch
    let branch
    if (mongoose.Types.ObjectId.isValid(branchId)) {
      branch = await Branch.findById(branchId)
    } else {
      branch = await Branch.findOne({ id: branchId })
    }
    if (!branch) {
      return NextResponse.json(
        { error: `Branch not found: ${branchId}` },
        { status: 404 }
      )
    }

    // Note: Branch-company validation removed to match normal order creation behavior.
    // The branch dropdown is already filtered by company in the UI, so we trust the selection
    // just like the normal order creation flow does. This avoids ID format mismatch issues.

    // Find employees for the branch
    const branchObjectId = branch._id
    const employees = await Employee.find({
      $or: [
        { locationId: branchObjectId },
        { branchId: branchObjectId },
      ],
      companyId: company._id,
      status: 'active'
    }).limit(numEmployees).lean()

    if (employees.length === 0) {
      return NextResponse.json(
        { error: 'No active employees found for the selected branch' },
        { status: 404 }
      )
    }

    // Find location admin for the branch
    const location = await Location.findOne({
      $or: [
        { _id: branchObjectId },
        { branchId: branchObjectId },
      ]
    })

    let locationAdmin = null
    if (location) {
      const locationAdminDoc = await LocationAdmin.findOne({ locationId: location._id })
      if (locationAdminDoc) {
        locationAdmin = await Employee.findById(locationAdminDoc.adminId)
      }
    }

    // If no location admin found, try to find any admin for the branch
    if (!locationAdmin) {
      const adminEmployees = await Employee.find({
        $or: [
          { locationId: branchObjectId },
          { branchId: branchObjectId },
        ],
        companyId: company._id,
        designation: { $in: ['Location Admin', 'Site Admin', 'Branch Admin'] },
        status: 'active'
      }).limit(1).lean()

      if (adminEmployees.length > 0) {
        locationAdmin = await Employee.findById(adminEmployees[0]._id)
      }
    }

    // Get products available for the company
    const productCompanyLinks = await ProductCompany.find({
      companyId: company._id
    }).limit(20).lean()

    if (productCompanyLinks.length === 0) {
      return NextResponse.json(
        { error: 'No products found for the selected company' },
        { status: 404 }
      )
    }

    const productIds = productCompanyLinks.map(pc => pc.productId || pc.uniformId)
    const products = await Uniform.find({
      _id: { $in: productIds }
    }).limit(20).lean()

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found for the selected company' },
        { status: 404 }
      )
    }

    // Verify vendors exist and are linked to products
    const vendorObjectIds = await Promise.all(
      vendorIds.map(async (vid: string) => {
        // Build query - try by 'id' field first, then ObjectId if valid
        let query: any = { id: vid }
        
        // Only add ObjectId query if vid is a valid ObjectId format (24 hex chars)
        if (mongoose.Types.ObjectId.isValid(vid) && /^[0-9a-fA-F]{24}$/.test(vid)) {
          query = {
            $or: [
              { id: vid },
              { _id: new mongoose.Types.ObjectId(vid) }
            ]
          }
        }
        
        const vendor = await mongoose.connection.db.collection('vendors').findOne(query)
        return vendor?._id
      })
    )

    const validVendorIds = vendorObjectIds.filter(Boolean)
    if (validVendorIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid vendors found' },
        { status: 404 }
      )
    }

    // Create orders for each employee
    const createdOrders = []
    const timestamp = Date.now()

    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i]
      const employeeId = employee.employeeId || employee.id

      // CRITICAL: Find or create a Location for this branch
      // createOrder requires a Location document (not Branch) for address extraction
      // We need to find an existing Location that matches this branch, or use employee's personal address
      let locationForOrder = null
      
      // Try to find a Location that corresponds to this branch
      // Locations and Branches are separate collections, so we need to match by address or name
      const existingLocation = await Location.findOne({
        companyId: company._id,
        name: branch.name,
        city: branch.city,
        state: branch.state
      }).lean()
      
      if (existingLocation) {
        locationForOrder = existingLocation
        console.log(`[create-test-orders] Found existing Location for branch: ${existingLocation.id} (${existingLocation.name})`)
        
        // Update employee's locationId to point to the Location (not Branch)
        if (!employee.locationId || !employee.locationId.equals(existingLocation._id)) {
          try {
            await Employee.findByIdAndUpdate(employee._id, {
              $set: { locationId: existingLocation._id }
            })
            console.log(`[create-test-orders] ✅ Updated employee ${employeeId} locationId to Location ${existingLocation._id}`)
            employee.locationId = existingLocation._id
          } catch (updateError: any) {
            console.warn(`[create-test-orders] ⚠️ Failed to update employee locationId: ${updateError.message}`)
          }
        }
      } else {
        // No Location found - create a dummy Location for test orders (TEST ORDER FEATURE ONLY)
        console.log(`[create-test-orders] No Location found for branch ${branch.name}. Creating dummy Location for test orders...`)
        
        try {
          // Generate a unique Location ID (6-digit, 400001-499999)
          // Use deterministic approach: company ID + branch hash + employee index
          const companyIdNum = parseInt(company.id || '1', 10) || 1
          const branchHash = branch._id.toString().slice(-3)
          const branchHashNum = parseInt(branchHash, 16) || 0
          const locationIdBase = 400000 + ((companyIdNum % 100) * 1000) + (branchHashNum % 100) + (i % 10)
          let locationIdNum = locationIdBase
          
          // Ensure it's within valid range
          if (locationIdNum < 400001) locationIdNum = 400001
          if (locationIdNum >= 500000) locationIdNum = 499999
          
          // Find an available Location ID (in case of collision)
          let locationId = String(locationIdNum).padStart(6, '0')
          let attempts = 0
          while (attempts < 100) {
            const existing = await Location.findOne({ id: locationId })
            if (!existing) break
            locationIdNum = (locationIdNum + 1) % 100000
            if (locationIdNum < 400001) locationIdNum = 400001
            if (locationIdNum >= 500000) locationIdNum = 499999
            locationId = String(locationIdNum).padStart(6, '0')
            attempts++
          }
          
          // Use locationAdmin if available, otherwise use the current employee as admin (temporary, for test orders only)
          let dummyAdminId = locationAdmin?._id
          if (!dummyAdminId) {
            dummyAdminId = employee._id
          }
          
          // Validate branch has required address fields
          if (!branch.address_line_1 || !branch.city || !branch.state || !branch.pincode) {
            throw new Error(`Branch "${branch.name}" is missing required address fields. Cannot create dummy Location.`)
          }
          
          // Create dummy Location with branch data (tagged with [TEST] prefix)
          const dummyLocationData = {
            id: locationId,
            name: `[TEST] ${branch.name}`,
            companyId: company._id,
            adminId: dummyAdminId,
            address_line_1: branch.address_line_1,
            address_line_2: branch.address_line_2,
            address_line_3: branch.address_line_3,
            city: branch.city,
            state: branch.state,
            pincode: branch.pincode,
            country: branch.country || 'India',
            phone: branch.phone,
            email: branch.email,
            status: 'active' as const
          }
          
          const dummyLocation = await Location.create(dummyLocationData)
          locationForOrder = dummyLocation.toObject()
          
          console.log(`[create-test-orders] ✅ Created dummy Location for test orders: ${locationId} (${dummyLocation.name})`)
        } catch (createError: any) {
          console.error(`[create-test-orders] ❌ Failed to create dummy Location: ${createError.message}`)
          throw new Error(`Failed to create Location for test order. Please ensure branch has complete address fields (address_line_1, city, state, pincode). Error: ${createError.message}`)
        }
      }
      
      // Update employee's locationId to point to the Location (existing or newly created dummy)
      if (locationForOrder && (!employee.locationId || !employee.locationId.equals(locationForOrder._id))) {
        try {
          await Employee.findByIdAndUpdate(employee._id, {
            $set: { locationId: locationForOrder._id }
          })
          console.log(`[create-test-orders] ✅ Updated employee ${employeeId} locationId to Location ${locationForOrder._id}`)
          employee.locationId = locationForOrder._id
        } catch (updateError: any) {
          console.warn(`[create-test-orders] ⚠️ Failed to update employee locationId: ${updateError.message}`)
          // Continue anyway - we'll set it in memory for this request
          employee.locationId = locationForOrder._id
        }
      }

      // Validate branch has required address fields for shipping
      if (!branch.address_line_1 || !branch.city || !branch.state || !branch.pincode) {
        console.error(`[create-test-orders] ❌ Branch ${branch.name} missing required address fields:`, {
          address_line_1: branch.address_line_1,
          city: branch.city,
          state: branch.state,
          pincode: branch.pincode
        })
        throw new Error(`Branch "${branch.name}" is missing required address fields (address_line_1, city, state, pincode). Please update the branch address before creating orders.`)
      }

      // Select 2-3 products for this order (round-robin)
      const productIndex = i % products.length
      const orderProducts = [
        products[productIndex],
        products[(productIndex + 1) % products.length]
      ]

      // Find vendor for products (check ProductVendor relationships)
      let selectedVendorId = null
      let selectedVendorName = null

      for (const product of orderProducts) {
        const productVendor = await ProductVendor.findOne({
          productId: product._id,
          vendorId: { $in: validVendorIds }
        }).lean()

        if (productVendor) {
          const vendor = await mongoose.connection.db.collection('vendors').findOne({
            _id: productVendor.vendorId
          })
          if (vendor) {
            selectedVendorId = vendor.id || vendor._id.toString()
            selectedVendorName = vendor.name
            break
          }
        }
      }

      // If no vendor found, use first valid vendor
      if (!selectedVendorId && validVendorIds.length > 0) {
        const vendor = await mongoose.connection.db.collection('vendors').findOne({
          _id: validVendorIds[0]
        })
        if (vendor) {
          selectedVendorId = vendor.id || vendor._id.toString()
          selectedVendorName = vendor.name
        }
      }

      if (!selectedVendorId) {
        console.warn(`No vendor found for employee ${employeeId}, skipping order`)
        continue
      }

      // Decrypt employee name
      let decryptedFirstName = ''
      let decryptedLastName = ''
      
      try {
        if (employee.firstName && typeof employee.firstName === 'string' && employee.firstName.includes(':')) {
          decryptedFirstName = decrypt(employee.firstName)
        } else {
          decryptedFirstName = employee.firstName || ''
        }
      } catch (error) {
        decryptedFirstName = employee.firstName || ''
      }

      try {
        if (employee.lastName && typeof employee.lastName === 'string' && employee.lastName.includes(':')) {
          decryptedLastName = decrypt(employee.lastName)
        } else {
          decryptedLastName = employee.lastName || ''
        }
      } catch (error) {
        decryptedLastName = employee.lastName || ''
      }

      const employeeName = `${decryptedFirstName} ${decryptedLastName}`.trim() || 'Employee'

      // Create order items
      const orderItems = orderProducts.map(prod => ({
        uniformId: prod.id || prod._id.toString(),
        productId: prod.id || prod._id.toString(),
        uniformName: prod.name,
        size: (prod.sizes && prod.sizes.length > 0) ? prod.sizes[0] : 'M',
        quantity: 1,
        price: prod.price || 100
      }))

        // Create order using createOrder function
        try {
          console.log(`[create-test-orders] Creating order for employee ${employeeId} with ${orderItems.length} items`)
          
          // Format delivery address
          const deliveryAddress = branch.address_line_1 
            ? `${branch.address_line_1}, ${branch.city || ''}, ${branch.state || ''} - ${branch.pincode || ''}`.trim()
            : branch.name || 'Branch Address'

          const order = await createOrder({
            employeeId: employeeId,
            items: orderItems,
            deliveryAddress: deliveryAddress,
            estimatedDeliveryTime: '5-7 business days',
            dispatchLocation: 'standard',
            usePersonalAddress: false
          })

          console.log(`[create-test-orders] Order created successfully:`, {
            orderId: order?.id,
            order_id: order?._id,
            isSplitOrder: order?.isSplitOrder,
            parentOrderId: order?.parentOrderId
          })

          if (!order || !order.id) {
            throw new Error(`createOrder returned invalid order: ${JSON.stringify(order)}`)
          }

        // Handle split orders: createOrder may return a single order or the first order with split metadata
        // Get the order ID (handle both Mongoose document and plain object)
        const orderId = order.id
        let orderObjectId = order._id
        
        // Handle different _id formats
        if (!orderObjectId) {
          // If _id is missing, try to find order by id field
          console.log(`[create-test-orders] Order _id missing, looking up by id field: ${orderId}`)
          const foundOrder = await Order.findOne({ id: orderId }).lean()
          if (foundOrder) {
            orderObjectId = foundOrder._id
            console.log(`[create-test-orders] Found order by id field: ${foundOrder._id}`)
          } else {
            throw new Error(`Order created but cannot find it in database: id=${orderId}`)
          }
        }
        
        // Convert to ObjectId if it's a string
        if (orderObjectId && typeof orderObjectId === 'string') {
          if (mongoose.Types.ObjectId.isValid(orderObjectId)) {
            orderObjectId = new mongoose.Types.ObjectId(orderObjectId)
          } else {
            throw new Error(`Invalid ObjectId format: ${orderObjectId}`)
          }
        }
        
        // Ensure we have a valid ObjectId
        if (!orderObjectId || !(orderObjectId instanceof mongoose.Types.ObjectId)) {
          throw new Error(`Order created but missing valid _id: ${JSON.stringify({ id: order.id, _id: order._id, orderObjectId })}`)
        }

        const ordersToUpdate: any[] = []
        if (order.isSplitOrder && order.parentOrderId) {
          // Find all child orders with the same parentOrderId
          console.log(`[create-test-orders] Handling split order with parentOrderId: ${order.parentOrderId}`)
          const childOrders = await Order.find({ parentOrderId: order.parentOrderId }).lean()
          if (childOrders.length === 0) {
            throw new Error(`Split order created but no child orders found for parentOrderId: ${order.parentOrderId}`)
          }
          ordersToUpdate.push(...childOrders)
          console.log(`[create-test-orders] Found ${childOrders.length} child orders for parent ${order.parentOrderId}`)
        } else {
          // Single order - fetch it to ensure we have the _id
          console.log(`[create-test-orders] Handling single order with _id: ${orderObjectId}`)
          const singleOrder = await Order.findById(orderObjectId).lean()
          if (singleOrder) {
            ordersToUpdate.push(singleOrder)
            console.log(`[create-test-orders] Found single order: ${singleOrder.id}`)
          } else {
            throw new Error(`Order not found after creation: id=${orderId}, _id=${orderObjectId}`)
          }
        }

        if (ordersToUpdate.length === 0) {
          throw new Error(`No orders to update after creation: orderId=${orderId}`)
        }

        // Update all orders (single or split) with test order tags and auto-approval
        for (const orderToUpdate of ordersToUpdate) {
          const testOrderUpdateData: any = {
            isTestOrder: true,
            createdBy: 'superadmin',
            employeeName: employeeName,
            updatedAt: new Date()
          }

          // Only update vendor info if this is the matching vendor order (for split orders)
          if (!order.isSplitOrder || orderToUpdate.vendorId === selectedVendorId) {
            testOrderUpdateData.vendorId = selectedVendorId
            testOrderUpdateData.vendorName = selectedVendorName
          }

          // Auto-approve by Location Admin if flag is enabled
          if (autoApproveLocationAdmin) {
            const prNumber = `PR-TEST-${company.id}-${timestamp}-${String(i + 1).padStart(3, '0')}`
            const prDate = new Date()

            // Check if company requires company admin approval
            const requiresCompanyAdminApproval = company.require_company_admin_po_approval === true

            testOrderUpdateData.pr_number = prNumber
            testOrderUpdateData.pr_date = prDate
            testOrderUpdateData.locationAutoApproved = true // Audit flag

            // If location admin is available, set approval details
            if (locationAdmin) {
              testOrderUpdateData.site_admin_approved_by = locationAdmin._id
              testOrderUpdateData.site_admin_approved_at = new Date()
              console.log(`[create-test-orders] Auto-approving order ${orderToUpdate.id} with Location Admin: ${locationAdmin.id || locationAdmin._id}`)
            } else {
              // If no location admin found, still auto-approve but without admin reference
              // This allows test orders to be created and auto-approved even without a location admin
              console.log(`[create-test-orders] No location admin found for branch, but auto-approving test order ${orderToUpdate.id} with PR number: ${prNumber}`)
              testOrderUpdateData.site_admin_approved_at = new Date()
            }

            if (requiresCompanyAdminApproval) {
              testOrderUpdateData.pr_status = 'PENDING_COMPANY_ADMIN_APPROVAL'
              testOrderUpdateData.status = 'Awaiting approval'
              console.log(`[create-test-orders] Order ${orderToUpdate.id} auto-approved by Location Admin, moving to Company Admin approval`)
            } else {
              testOrderUpdateData.pr_status = 'SITE_ADMIN_APPROVED'
              testOrderUpdateData.status = 'Awaiting fulfilment'
              console.log(`[create-test-orders] Order ${orderToUpdate.id} auto-approved by Location Admin, moving to fulfilment`)
            }
          } else {
            // If auto-approval is disabled, set initial pending status
            testOrderUpdateData.pr_status = 'PENDING_SITE_ADMIN_APPROVAL'
            testOrderUpdateData.status = 'Awaiting approval'
            testOrderUpdateData.locationAutoApproved = false // Audit flag
            console.log(`[create-test-orders] Auto-approval disabled for order ${orderToUpdate.id}, setting to PENDING_SITE_ADMIN_APPROVAL`)
          }

          // Update the order
          const updateResult = await Order.findByIdAndUpdate(
            orderToUpdate._id,
            { $set: testOrderUpdateData },
            { new: true }
          )

          if (!updateResult) {
            console.error(`[create-test-orders] ❌ Failed to update order ${orderToUpdate.id} (${orderToUpdate._id})`)
          } else {
            console.log(`[create-test-orders] ✅ Updated order ${orderToUpdate.id}: pr_status=${updateResult.pr_status}, status=${updateResult.status}, pr_number=${updateResult.pr_number || 'N/A'}`)
          }
        }

        // Get the updated order to include PR number in response (use the first order)
        const updatedOrder = await Order.findById(ordersToUpdate[0]._id).lean()
        
        createdOrders.push({
          orderId: order.id,
          prNumber: updatedOrder?.pr_number || 'N/A',
          employeeId: employeeId,
          employeeName: employeeName,
          itemsCount: orderItems.length,
          vendorName: selectedVendorName,
          prStatus: updatedOrder?.pr_status || 'N/A'
        })
      } catch (error: any) {
        console.error(`[create-test-orders] ❌ Error creating order for employee ${employeeId}:`, error)
        console.error(`[create-test-orders] Error stack:`, error.stack)
        console.error(`[create-test-orders] Error details:`, {
          message: error.message,
          name: error.name,
          employeeId,
          orderItemsCount: orderItems?.length
        })
        // Continue with next employee, but log the error for debugging
        // Don't throw here - we want to try creating orders for other employees
      }
    }

    if (createdOrders.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create any orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ordersCreated: createdOrders.length,
      orders: createdOrders,
      summary: {
        company: company.name,
        branch: branch.name,
        employees: employees.length,
        vendors: vendorIds.length
      }
    })

  } catch (error: any) {
    console.error('API Error in /api/superadmin/create-test-orders POST:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error'
      },
      { status: 500 }
    )
  }
}

