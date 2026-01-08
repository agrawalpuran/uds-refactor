import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import connectDB from '@/lib/db/mongodb'
import { 
  getEmployeeByEmployeeId, 
  getLocationByAdminEmail,
  isLocationAdmin,
  isEmployeeInLocation,
  createOrder, 
  validateBulkOrderItemSubcategoryEligibility
} from '@/lib/db/data-access'
import Employee from '@/lib/models/Employee'
import Location from '@/lib/models/Location'
import Uniform from '@/lib/models/Uniform'
import mongoose from 'mongoose'

interface BulkOrderRow {
  employeeId: string
  productCode: string
  size: string
  quantity: number
  shippingLocation?: string
  rowNumber: number
}

interface BulkOrderResult {
  rowNumber: number
  employeeId: string
  productCode: string
  size: string
  quantity: number
  status: 'success' | 'failed'
  orderId?: string
  error?: string
}

/**
 * POST /api/orders/site-bulk-excel
 * 
 * Process bulk orders from Excel file for Site Admin
 * STRICT SITE SCOPING: Only employees from Site Admin's location are allowed
 * 
 * Expected Excel format:
 * - Sheet "Bulk Orders" with columns: Employee ID, Product Code, Size, Quantity, Shipping Location
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const adminEmail = formData.get('adminEmail') as string

    if (!file) {
      return NextResponse.json({ error: 'Excel file is required' }, { status: 400 })
    }

    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email is required' }, { status: 400 })
    }

    // Verify Site Admin access and get location
    const location = await getLocationByAdminEmail(adminEmail.trim().toLowerCase())
    if (!location) {
      return NextResponse.json({ 
        error: 'Unauthorized: Only Site Admins can upload bulk orders via Excel' 
      }, { status: 403 })
    }

    // CRITICAL: getLocationByAdminEmail returns a plain object with 'id' (string), not '_id'
    // We need to fetch the Location again by its string id to get the ObjectId _id
    const locationIdStr = location.id
    if (!locationIdStr) {
      return NextResponse.json({ 
        error: 'Location ID not found' 
      }, { status: 400 })
    }

    // Fetch location by string id to get the ObjectId _id for querying employees
    const locationDoc = await Location.findOne({ id: locationIdStr }).lean()
    if (!locationDoc || !locationDoc._id) {
      return NextResponse.json({ 
        error: 'Location not found in database' 
      }, { status: 404 })
    }

    const locationId = locationDoc._id // This is the ObjectId needed for Employee queries
    const locationName = location.name || locationDoc.name || 'Location'
    
    // Get companyId from location for eligibility validation
    let companyId: string | null = null
    if (locationDoc.companyId) {
      if (typeof locationDoc.companyId === 'object' && locationDoc.companyId._id) {
        companyId = locationDoc.companyId._id.toString()
      } else if (typeof locationDoc.companyId === 'object' && locationDoc.companyId.id) {
        companyId = locationDoc.companyId.id
      } else if (typeof locationDoc.companyId === 'string') {
        companyId = locationDoc.companyId
      }
    }
    
    if (!companyId) {
      return NextResponse.json({ 
        error: 'Company ID not found for location' 
      }, { status: 400 })
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Get "Bulk Orders" sheet
    const bulkOrdersSheet = workbook.Sheets['Bulk Orders']
    if (!bulkOrdersSheet) {
      return NextResponse.json({ 
        error: 'Excel file must contain a "Bulk Orders" sheet' 
      }, { status: 400 })
    }

    // Convert sheet to JSON
    const rows = XLSX.utils.sheet_to_json(bulkOrdersSheet, { header: 1, defval: '' })

    if (rows.length < 2) {
      return NextResponse.json({ 
        error: 'Excel must contain at least a header row and one data row' 
      }, { status: 400 })
    }

    // Parse headers (case-insensitive, flexible column matching)
    const headers = (rows[0] || []).map((h: any) => String(h).trim().toLowerCase())
    const employeeIdIndex = headers.findIndex(h => 
      h === 'employee id' || h === 'employeeid' || h === 'employee_no' || h === 'employee no'
    )
    const productCodeIndex = headers.findIndex(h => 
      h === 'product code' || h === 'productcode' || h === 'product_code' || h === 'product id' || h === 'productid' || h === 'product_id'
    )
    const sizeIndex = headers.findIndex(h => h === 'size')
    const quantityIndex = headers.findIndex(h => 
      h === 'quantity' || h === 'qty' || h === 'qty.'
    )
    const shippingLocationIndex = headers.findIndex(h => 
      h === 'shipping location' || h === 'shippinglocation' || h === 'location' || h === 'dispatch location'
    )

    if (employeeIdIndex === -1 || productCodeIndex === -1 || sizeIndex === -1 || quantityIndex === -1) {
      return NextResponse.json({ 
        error: 'Excel must contain columns: Employee ID, Product Code, Size, Quantity' 
      }, { status: 400 })
    }

    // Parse orders from Excel
    const orders: BulkOrderRow[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue // Skip empty rows

      const employeeId = String(row[employeeIdIndex] || '').trim()
      const productCode = String(row[productCodeIndex] || '').trim()
      const size = String(row[sizeIndex] || '').trim()
      const quantity = parseInt(String(row[quantityIndex] || '0')) || 0
      const shippingLocation = shippingLocationIndex >= 0 ? String(row[shippingLocationIndex] || '').trim() : undefined

      if (employeeId && productCode && size && quantity > 0) {
        orders.push({
          employeeId,
          productCode,
          size,
          quantity,
          shippingLocation,
          rowNumber: i + 1
        })
      }
    }

    if (orders.length === 0) {
      return NextResponse.json({ 
        error: 'No valid orders found in Excel file' 
      }, { status: 400 })
    }

    // Get all employees in this location for validation
    const locationEmployees = await Employee.find({ 
      locationId: locationId,
      status: 'active' 
    })
      .lean()

    const locationEmployeeIds = new Set<string>()
    const locationEmployeeMap = new Map<string, any>()
    
    locationEmployees.forEach((emp: any) => {
      const empId = emp.employeeId || emp.id
      if (empId) {
        locationEmployeeIds.add(String(empId))
        locationEmployeeMap.set(String(empId), emp)
      }
    })

    // Get all products by code for validation
    const productCodes = Array.from(new Set(orders.map(o => o.productCode)))
    const products = await Uniform.find({
      $or: [
        { id: { $in: productCodes } },
        { _id: { $in: productCodes.filter(c => mongoose.Types.ObjectId.isValid(c)).map(c => new mongoose.Types.ObjectId(c)) } }
      ]
    })
      .lean()

    const productByCodeMap = new Map<string, any>()
    products.forEach((product: any) => {
      if (product.id) {
        productByCodeMap.set(product.id, product)
      }
      if (product._id) {
        productByCodeMap.set(product._id.toString(), product)
      }
    })

    // Process each order with STRICT SITE VALIDATION
    const results: BulkOrderResult[] = []
    const validOrderItems: any[] = []
    const orderGroups = new Map<string, any[]>() // Group by employeeId

    for (const row of orders) {
      // CRITICAL SITE VALIDATION: Check if employee belongs to Site Admin's location
      if (!locationEmployeeIds.has(row.employeeId)) {
        results.push({
          rowNumber: row.rowNumber,
          employeeId: row.employeeId,
          productCode: row.productCode,
          size: row.size,
          quantity: row.quantity,
          status: 'failed',
          error: `Employee ${row.employeeId} does not belong to your site (${location.name || locationIdStr}). Only employees from your location can be ordered for.`
        })
        continue
      }

      const employee = locationEmployeeMap.get(row.employeeId)
      if (!employee) {
        results.push({
          rowNumber: row.rowNumber,
          employeeId: row.employeeId,
          productCode: row.productCode,
          size: row.size,
          quantity: row.quantity,
          status: 'failed',
          error: `Employee ${row.employeeId} not found in your location`
        })
        continue
      }

      // Verify employee is active
      if (employee.status !== 'active') {
        results.push({
          rowNumber: row.rowNumber,
          employeeId: row.employeeId,
          productCode: row.productCode,
          size: row.size,
          quantity: row.quantity,
          status: 'failed',
          error: `Employee ${row.employeeId} is not active`
        })
        continue
      }

      // Find product by readable product code
      const product = productByCodeMap.get(row.productCode)
      if (!product) {
        results.push({
          rowNumber: row.rowNumber,
          employeeId: row.employeeId,
          productCode: row.productCode,
          size: row.size,
          quantity: row.quantity,
          status: 'failed',
          error: `Product not found: ${row.productCode}. Please use Product Code from the Product Reference sheet.`
        })
        continue
      }

      // Validate size (CRITICAL - Size must be supported by product)
      const productSizes = product.sizes || []
      const normalizedSize = row.size.trim()
      const isSizeSupported = productSizes.some((s: string) => 
        s.trim().toLowerCase() === normalizedSize.toLowerCase()
      )

      if (!isSizeSupported) {
        results.push({
          rowNumber: row.rowNumber,
          employeeId: row.employeeId,
          productCode: row.productCode,
          size: row.size,
          quantity: row.quantity,
          status: 'failed',
          error: `Size "${row.size}" is not supported for this product. Supported sizes: ${productSizes.join(', ')}`
        })
        continue
      }

      // Validate eligibility (subcategory-based)
      // Use product ObjectId for validation (same as Company Admin endpoint)
      const productObjectId = product._id?.toString()
      if (!productObjectId) {
        results.push({
          rowNumber: row.rowNumber,
          employeeId: row.employeeId,
          productCode: row.productCode,
          size: row.size,
          quantity: row.quantity,
          status: 'failed',
          error: `Invalid product data: ${row.productCode}`
        })
        continue
      }

      try {
        // Use employeeId (readable ID) for validation, not _id
        // The validation function looks up by employeeId or id field
        const employeeIdForValidation = employee.employeeId || employee.id || employee._id.toString()
        
        const validation = await validateBulkOrderItemSubcategoryEligibility(
          employeeIdForValidation,
          productObjectId, // Use ObjectId string for validation function
          row.quantity,
          companyId // CRITICAL: Pass companyId, not size!
        )

        if (!validation.valid) {
          results.push({
            rowNumber: row.rowNumber,
            employeeId: row.employeeId,
            productCode: row.productCode,
            size: row.size,
            quantity: row.quantity,
            status: 'failed',
            error: validation.error || 'Product not eligible for this employee'
          })
          continue
        }
      } catch (eligError: any) {
        results.push({
          rowNumber: row.rowNumber,
          employeeId: row.employeeId,
          productCode: row.productCode,
          size: row.size,
          quantity: row.quantity,
          status: 'failed',
          error: `Eligibility validation failed: ${eligError.message || 'Unknown error'}`
        })
        continue
      }

      // All validations passed - add to valid orders
      validOrderItems.push({
        uniformId: product.id,
        uniformName: product.name || 'Unknown Product',
        size: normalizedSize,
        quantity: row.quantity,
        price: product.price || 0,
        rowNumber: row.rowNumber
      })

      // Group by employeeId for order creation
      if (!orderGroups.has(row.employeeId)) {
        orderGroups.set(row.employeeId, [])
      }
      orderGroups.get(row.employeeId)!.push({
        uniformId: product.id,
        uniformName: product.name || 'Unknown Product',
        size: normalizedSize,
        quantity: row.quantity,
        price: product.price || 0,
        rowNumber: row.rowNumber
      })
    }

    // Create orders (one per employee)
    for (const [employeeId, items] of orderGroups.entries()) {
      const employee = locationEmployeeMap.get(employeeId)
      if (!employee) continue

      try {
        // Get employee for delivery address and dispatch preference
        const fullEmployee = await Employee.findById(employee._id)
          .select('address dispatchPreference employeeId id')
          .lean()

        if (!fullEmployee) {
          // Mark all items for this employee as failed
          items.forEach(item => {
            results.push({
              rowNumber: item.rowNumber,
              employeeId: employeeId,
              productCode: productByCodeMap.get(item.uniformId)?.id || item.uniformId,
              size: item.size,
              quantity: item.quantity,
              status: 'failed',
              error: `Employee not found: ${employeeId}`
            })
          })
          continue
        }

        // Use employeeId or id field for createOrder (same as Company Admin)
        const employeeIdString = fullEmployee.employeeId || fullEmployee.id || employee._id.toString()

        const dispatchPreference = fullEmployee?.dispatchPreference || 'standard'
        let estimatedDeliveryTime = '5-7 business days'
        if (dispatchPreference === 'direct') {
          estimatedDeliveryTime = '3-5 business days'
        } else if (dispatchPreference === 'central') {
          estimatedDeliveryTime = '5-7 business days'
        } else {
          estimatedDeliveryTime = '7-10 business days'
        }

        const deliveryAddress = fullEmployee?.address || items[0]?.shippingLocation || location.address || 'Address not available'

        const order = await createOrder({
          employeeId: employeeIdString,
          items: items.map(item => ({
            uniformId: item.uniformId,
            uniformName: item.uniformName,
            size: item.size,
            quantity: item.quantity,
            price: item.price
          })),
          deliveryAddress: deliveryAddress,
          estimatedDeliveryTime: estimatedDeliveryTime, // CRITICAL: Required field
          dispatchLocation: items[0]?.shippingLocation || dispatchPreference,
          usePersonalAddress: false // Bulk uploads always use official location
        })

        // Mark all items for this employee as successful
        items.forEach(item => {
          results.push({
            rowNumber: item.rowNumber,
            employeeId: employeeId,
            productCode: productByCodeMap.get(item.uniformId)?.id || item.uniformId,
            size: item.size,
            quantity: item.quantity,
            status: 'success',
            orderId: order.id || order._id?.toString()
          })
        })
      } catch (orderError: any) {
        // Mark all items for this employee as failed
        items.forEach(item => {
          results.push({
            rowNumber: item.rowNumber,
            employeeId: employeeId,
            productCode: productByCodeMap.get(item.uniformId)?.id || item.uniformId,
            size: item.size,
            quantity: item.quantity,
            status: 'failed',
            error: `Failed to create order: ${orderError.message || 'Unknown error'}`
          })
        })
      }
    }

    // Calculate summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    }

    return NextResponse.json({
      summary,
      results,
      location: {
        id: locationIdStr,
        name: location.name
      }
    })
  } catch (error: any) {
    console.error('Error processing site bulk orders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process bulk orders' },
      { status: 500 }
    )
  }
}

