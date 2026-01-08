/**
 * Product-Subcategory Mapping APIs (Company-Specific)
 * 
 * Maps products to subcategories with company-specific context.
 * The SAME product can be mapped to DIFFERENT subcategories for DIFFERENT companies.
 * 
 * SECURITY: All operations validate companyId from auth context.
 */

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import ProductSubcategoryMapping from '@/lib/models/ProductSubcategoryMapping'
import Subcategory from '@/lib/models/Subcategory'
import { validateAndGetCompanyId } from '@/lib/utils/api-auth'
import mongoose from 'mongoose'

/**
 * GET /api/product-subcategory-mappings
 * Get product-subcategory mappings for a company
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')
    const productId = searchParams.get('productId') // Optional: filter by product
    const subCategoryId = searchParams.get('subCategoryId') // Optional: filter by subcategory
    
    // CRITICAL FIX: Allow both Company Admin AND Employee access for read operations
    // Employees need to read mappings to see products in catalog
    let validatedCompanyId: string
    try {
      // First try Company Admin authentication
      const authContext = await validateAndGetCompanyId(request, companyId)
      validatedCompanyId = authContext.companyId
    } catch (adminError: any) {
      // If Company Admin auth fails, try Employee authentication
      try {
        const { getUserEmailFromRequest } = await import('@/lib/utils/api-auth')
        const { getEmployeeByEmail } = await import('@/lib/db/data-access')
        
        const userEmail = await getUserEmailFromRequest(request)
        if (!userEmail) {
          return NextResponse.json(
            { error: 'Unauthorized: No user email provided' },
            { status: 401 }
          )
        }
        
        // Get employee and validate they belong to the requested company
        const employee = await getEmployeeByEmail(userEmail)
        if (!employee) {
          return NextResponse.json(
            { error: 'Unauthorized: User is not an employee' },
            { status: 401 }
          )
        }
        
        // Extract companyId from employee
        let employeeCompanyId: string | undefined
        if (employee.companyId) {
          if (typeof employee.companyId === 'object' && employee.companyId !== null) {
            employeeCompanyId = employee.companyId.id ? String(employee.companyId.id) : undefined
          } else if (typeof employee.companyId === 'number') {
            employeeCompanyId = String(employee.companyId)
          } else if (typeof employee.companyId === 'string') {
            employeeCompanyId = employee.companyId
          }
        }
        
        if (!employeeCompanyId) {
          return NextResponse.json(
            { error: 'Unauthorized: Employee has no company assigned' },
            { status: 401 }
          )
        }
        
        // Validate requested companyId matches employee's company
        if (companyId && companyId !== employeeCompanyId) {
          return NextResponse.json(
            { error: 'Forbidden: Cannot access mappings for other companies' },
            { status: 403 }
          )
        }
        
        validatedCompanyId = employeeCompanyId
      } catch (employeeError: any) {
        // Both Company Admin and Employee auth failed
        return NextResponse.json(
          { error: 'Unauthorized: User is not a Company Admin or Employee' },
          { status: 401 }
        )
      }
    }
    
    // Get company ObjectId
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    const company = await mongoose.connection.db.collection('companies').findOne({
      $or: [
        { id: validatedCompanyId },
        ...(mongoose.Types.ObjectId.isValid(validatedCompanyId) ? [{ _id: new mongoose.Types.ObjectId(validatedCompanyId) }] : [])
      ]
    })
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    // Build query
    const query: any = {
      companyId: company._id
    }
    
    if (productId) {
      if (mongoose.Types.ObjectId.isValid(productId)) {
        query.productId = new mongoose.Types.ObjectId(productId)
      } else {
        // Try to find product by id field
        if (!mongoose.connection.db) {
          return NextResponse.json(
            { error: 'Database connection not available' },
            { status: 500 }
          )
        }
        const product = await mongoose.connection.db.collection('uniforms').findOne({ id: productId })
        if (product) {
          query.productId = product._id
        } else {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          )
        }
      }
    }
    
    if (subCategoryId) {
      if (mongoose.Types.ObjectId.isValid(subCategoryId)) {
        query.subCategoryId = new mongoose.Types.ObjectId(subCategoryId)
      } else {
        const subcategory = await Subcategory.findOne({ id: subCategoryId })
        if (subcategory) {
          query.subCategoryId = subcategory._id
        } else {
          return NextResponse.json(
            { error: 'Subcategory not found' },
            { status: 404 }
          )
        }
      }
    }
    
    const mappings = await ProductSubcategoryMapping.find(query)
      .populate('productId', 'id name category categoryId gender price image sku')
      .populate('subCategoryId', 'id name parentCategoryId')
      .populate({
        path: 'subCategoryId',
        populate: {
          path: 'parentCategoryId',
          select: 'id name isSystemCategory'
        }
      })
      .lean()
    
    return NextResponse.json({
      success: true,
      mappings: mappings.map((mapping: any) => {
        // CRITICAL FIX: Use string 'id' fields instead of ObjectId '_id' for productId and subCategoryId
        // This ensures UI can match saved mappings with displayed products/subcategories
        const productId = mapping.productId?.id || 
                         (mapping.productId?._id?.toString())
        const subCategoryId = mapping.subCategoryId?.id || 
                             (mapping.subCategoryId?._id?.toString())
        
        return {
          _id: mapping._id?.toString() || mapping._id,
          productId: productId, // Use string 'id' field, not ObjectId '_id'
          product: mapping.productId ? {
            id: (mapping.productId as any).id,
            name: (mapping.productId as any).name,
            category: (mapping.productId as any).category,
            categoryId: (mapping.productId as any).categoryId?.toString(),
            gender: (mapping.productId as any).gender,
            price: (mapping.productId as any).price,
            image: (mapping.productId as any).image,
            sku: (mapping.productId as any).sku
          } : null,
          subCategoryId: subCategoryId, // Use string 'id' field, not ObjectId '_id'
          subcategory: mapping.subCategoryId ? {
            id: (mapping.subCategoryId as any).id,
            name: (mapping.subCategoryId as any).name,
            parentCategoryId: (mapping.subCategoryId as any).parentCategoryId?._id?.toString() || 
                             (mapping.subCategoryId as any).parentCategoryId?.toString(),
            parentCategory: (mapping.subCategoryId as any).parentCategoryId ? {
              id: (mapping.subCategoryId as any).parentCategoryId.id,
              name: (mapping.subCategoryId as any).parentCategoryId.name,
              isSystemCategory: (mapping.subCategoryId as any).parentCategoryId.isSystemCategory
            } : null
          } : null,
          companyId: mapping.companyId.toString(),
          companySpecificPrice: mapping.companySpecificPrice,
          createdAt: mapping.createdAt,
          updatedAt: mapping.updatedAt
        }
      })
    })
  } catch (error: any) {
    console.error('Error fetching product-subcategory mappings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mappings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/product-subcategory-mappings
 * Create a product-subcategory mapping (Company Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { companyId, productId, subCategoryId, companySpecificPrice } = body
    
    if (!productId || !subCategoryId) {
      return NextResponse.json(
        { error: 'productId and subCategoryId are required' },
        { status: 400 }
      )
    }
    
    // Validate companyId from authenticated user context
    let validatedCompanyId: string
    try {
      const authContext = await validateAndGetCompanyId(request, companyId)
      validatedCompanyId = authContext.companyId
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get company ObjectId
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    const company = await mongoose.connection.db.collection('companies').findOne({
      $or: [
        { id: validatedCompanyId },
        ...(mongoose.Types.ObjectId.isValid(validatedCompanyId) ? [{ _id: new mongoose.Types.ObjectId(validatedCompanyId) }] : [])
      ]
    })
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    // Get product ObjectId
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    let product = null
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await mongoose.connection.db.collection('uniforms').findOne({
        _id: new mongoose.Types.ObjectId(productId)
      })
    } else {
      product = await mongoose.connection.db.collection('uniforms').findOne({ id: productId })
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Get subcategory ObjectId and validate it belongs to the company
    let subcategory = null
    if (mongoose.Types.ObjectId.isValid(subCategoryId)) {
      subcategory = await Subcategory.findById(subCategoryId)
    } else {
      subcategory = await Subcategory.findOne({ id: subCategoryId })
    }
    
    if (!subcategory) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      )
    }
    
    // CRITICAL SECURITY CHECK: Ensure subcategory belongs to the company
    if (subcategory.companyId.toString() !== company._id.toString()) {
      return NextResponse.json(
        { error: 'Subcategory does not belong to the specified company' },
        { status: 403 }
      )
    }
    
    if (subcategory.status !== 'active') {
      return NextResponse.json(
        { error: 'Subcategory is not active' },
        { status: 400 }
      )
    }
    
    // Check if mapping already exists
    const existing = await ProductSubcategoryMapping.findOne({
      productId: product._id,
      subCategoryId: subcategory._id,
      companyId: company._id
    })
    
    if (existing) {
      console.log('[POST /product-subcategory-mappings] Mapping already exists:', {
        productId: product.id,
        subCategoryId: subcategory.id,
        companyId: validatedCompanyId
      })
      return NextResponse.json(
        { error: 'Product-subcategory mapping already exists for this company' },
        { status: 409 }
      )
    }
    
    // Log before creation for debugging
    console.log('[POST /product-subcategory-mappings] Creating mapping:', {
      productId: product.id || product._id.toString(),
      productObjectId: product._id.toString(),
      subCategoryId: subcategory.id || subcategory._id.toString(),
      subCategoryObjectId: subcategory._id.toString(),
      companyId: validatedCompanyId,
      companyObjectId: company._id.toString(),
      companySpecificPrice
    })
    
    // Create mapping
    let mapping
    try {
      mapping = await ProductSubcategoryMapping.create({
        productId: product._id,
        subCategoryId: subcategory._id,
        companyId: company._id,
        companySpecificPrice: companySpecificPrice !== undefined ? companySpecificPrice : undefined
      })
      console.log('[POST /product-subcategory-mappings] ✅ Mapping created successfully:', {
        mappingId: mapping._id.toString(),
        productId: product.id,
        subCategoryId: subcategory.id
      })
    } catch (createError: any) {
      console.error('[POST /product-subcategory-mappings] ❌ Error during ProductSubcategoryMapping.create():', {
        error: createError.message,
        errorCode: createError.code,
        errorName: createError.name,
        stack: createError.stack,
        productId: product.id,
        subCategoryId: subcategory.id,
        companyId: validatedCompanyId
      })
      throw createError // Re-throw to be caught by outer catch block
    }
    
    await mapping.populate('productId', 'id name')
    await mapping.populate('subCategoryId', 'id name')
    
    // CRITICAL FIX: Return string 'id' fields instead of ObjectId '_id' for consistency with GET endpoint
    const populatedProduct = mapping.productId as any
    const populatedSubcategory = mapping.subCategoryId as any
    
    return NextResponse.json({
      success: true,
      mapping: {
        _id: mapping._id.toString(),
        productId: populatedProduct?.id || product._id.toString(), // Use string 'id' field
        subCategoryId: populatedSubcategory?.id || subcategory._id.toString(), // Use string 'id' field
        companyId: mapping.companyId.toString(),
        companySpecificPrice: mapping.companySpecificPrice
      }
    })
  } catch (error: any) {
    console.error('[POST /product-subcategory-mappings] ❌ CRITICAL ERROR creating mapping:', {
      errorMessage: error.message,
      errorCode: error.code,
      errorName: error.name,
      errorStack: error.stack,
      errorString: String(error),
      errorType: typeof error,
      errorKeys: Object.keys(error || {})
    })
    
    // Handle duplicate key error (MongoDB unique constraint violation)
    if (error.code === 11000) {
      console.error('[POST /product-subcategory-mappings] Duplicate key error (11000):', error.keyPattern || error.keyValue)
      return NextResponse.json(
        { error: 'Product-subcategory mapping already exists for this company' },
        { status: 409 }
      )
    }
    
    // Handle validation errors from pre-save hook
    if (error.name === 'ValidationError' || error.message?.includes('Subcategory')) {
      console.error('[POST /product-subcategory-mappings] Validation error from pre-save hook:', error.message)
      return NextResponse.json(
        { error: error.message || 'Validation failed: Subcategory validation error' },
        { status: 400 }
      )
    }
    
    // Return detailed error for debugging (in production, you might want to sanitize this)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create mapping',
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          name: error.name,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/product-subcategory-mappings
 * Delete a product-subcategory mapping (Company Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const mappingId = searchParams.get('mappingId')
    
    if (!mappingId) {
      return NextResponse.json(
        { error: 'mappingId is required' },
        { status: 400 }
      )
    }
    
    // Find mapping
    let mapping = null
    if (mongoose.Types.ObjectId.isValid(mappingId)) {
      mapping = await ProductSubcategoryMapping.findById(mappingId)
    } else {
      return NextResponse.json(
        { error: 'Invalid mappingId format' },
        { status: 400 }
      )
    }
    
    if (!mapping) {
      return NextResponse.json(
        { error: 'Mapping not found' },
        { status: 404 }
      )
    }
    
    // Validate companyId from authenticated user context and ensure mapping belongs to user's company
    try {
      const authContext = await validateAndGetCompanyId(request)
      if (!mongoose.connection.db) {
        return NextResponse.json(
          { error: 'Database connection not available' },
          { status: 500 }
        )
      }
      const company = await mongoose.connection.db.collection('companies').findOne({
        $or: [
          { id: authContext.companyId },
          ...(mongoose.Types.ObjectId.isValid(authContext.companyId) ? [{ _id: new mongoose.Types.ObjectId(authContext.companyId) }] : [])
        ]
      })
      if (company && mapping.companyId.toString() !== company._id.toString()) {
        return NextResponse.json(
          { error: 'Forbidden: Mapping does not belong to your company' },
          { status: 403 }
        )
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Delete mapping
    await ProductSubcategoryMapping.deleteOne({ _id: mapping._id })
    
    return NextResponse.json({
      success: true,
      message: 'Product-subcategory mapping deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting product-subcategory mapping:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete mapping' },
      { status: 500 }
    )
  }
}

