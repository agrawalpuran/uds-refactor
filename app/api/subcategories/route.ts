/**
 * Company Admin Subcategory Management APIs
 * 
 * Subcategories are COMPANY-SPECIFIC and managed by Company Admin.
 * Each subcategory has a parent category (global).
 * 
 * SECURITY: All operations validate companyId from auth context.
 */

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Subcategory from '@/lib/models/Subcategory'
import Category from '@/lib/models/Category'
import { validateAndGetCompanyId } from '@/lib/utils/api-auth'
import mongoose from 'mongoose'

/**
 * GET /api/subcategories
 * Get subcategories for a company (filtered by category if provided)
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')
    const categoryId = searchParams.get('categoryId') // Optional: filter by parent category
    const status = searchParams.get('status') // Optional: 'active' | 'inactive'
    
    console.log('[API /subcategories] Request params:', { companyId, categoryId, status })
    
    // Validate companyId from authenticated user context
    let validatedCompanyId: string
    try {
      const authContext = await validateAndGetCompanyId(request, companyId)
      validatedCompanyId = authContext.companyId
      console.log('[API /subcategories] Validated companyId:', validatedCompanyId)
    } catch (error: any) {
      console.error('[API /subcategories] ❌ Authentication failed:', error.message)
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get company ObjectId
    const company = await mongoose.connection.db.collection('companies').findOne({
      $or: [
        { id: validatedCompanyId },
        { _id: mongoose.Types.ObjectId.isValid(validatedCompanyId) ? new mongoose.Types.ObjectId(validatedCompanyId) : null }
      ]
    })
    
    if (!company) {
      console.error('[API /subcategories] ❌ Company not found for ID:', validatedCompanyId)
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    console.log('[API /subcategories] Found company:', { id: company.id, _id: company._id.toString() })
    
    // Build query
    const query: any = {
      companyId: company._id
    }
    
    if (categoryId) {
      // Find parent category
      let parentCategory = null
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        parentCategory = await Category.findById(categoryId)
      } else {
        parentCategory = await Category.findOne({ id: categoryId })
      }
      
      if (!parentCategory) {
        console.error('[API /subcategories] ❌ Parent category not found:', categoryId)
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        )
      }
      
      query.parentCategoryId = parentCategory._id
      console.log('[API /subcategories] Filtering by parent category:', parentCategory.name)
    }
    
    if (status === 'active' || status === 'inactive') {
      query.status = status
      console.log('[API /subcategories] Filtering by status:', status)
    }
    
    console.log('[API /subcategories] Query:', {
      companyId: query.companyId?.toString(),
      parentCategoryId: query.parentCategoryId?.toString(),
      status: query.status
    })
    
    // First, check if ANY subcategories exist for this company (for debugging)
    const allCompanySubcategories = await Subcategory.find({ companyId: company._id }).lean()
    console.log('[API /subcategories] All subcategories for company (no filters):', {
      count: allCompanySubcategories.length,
      breakdown: {
        active: allCompanySubcategories.filter((s: any) => s.status === 'active').length,
        inactive: allCompanySubcategories.filter((s: any) => s.status === 'inactive').length,
      },
      samples: allCompanySubcategories.slice(0, 3).map((s: any) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        companyId: s.companyId?.toString(),
      }))
    })
    
    const subcategories = await Subcategory.find(query)
      .populate('parentCategoryId', 'id name isSystemCategory')
      .sort({ name: 1 })
      .lean()
    
    console.log('[API /subcategories] Found subcategories with query:', {
      count: subcategories.length,
      raw: subcategories.map((s: any) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        companyId: s.companyId?.toString(),
        parentCategoryId: s.parentCategoryId,
        parentCategoryIdType: typeof s.parentCategoryId,
        parentCategoryIdKeys: s.parentCategoryId && typeof s.parentCategoryId === 'object' ? Object.keys(s.parentCategoryId) : 'N/A',
      }))
    })
    
    // Map subcategories to response format
    const mappedSubcategories = subcategories.map((sub: any) => {
      // Handle populated parentCategoryId - with lean(), it's either an ObjectId or a populated object
      const parentCategoryId = sub.parentCategoryId
      let parentCategory: any = null
      
      if (parentCategoryId) {
        // Check if it's populated (has _id property) or just an ObjectId
        if (typeof parentCategoryId === 'object' && '_id' in parentCategoryId) {
          // It's populated - extract the data
          parentCategory = {
            id: (parentCategoryId as any).id || (parentCategoryId as any)._id?.toString(),
            name: (parentCategoryId as any).name,
            isSystemCategory: (parentCategoryId as any).isSystemCategory
          }
        } else if (typeof parentCategoryId === 'object' && 'id' in parentCategoryId) {
          // It's populated with the 'id' field selected
          parentCategory = {
            id: (parentCategoryId as any).id,
            name: (parentCategoryId as any).name,
            isSystemCategory: (parentCategoryId as any).isSystemCategory
          }
        }
      }
      
      const parentCategoryIdStr = typeof parentCategoryId === 'object' && '_id' in parentCategoryId 
        ? (parentCategoryId as any)._id?.toString() 
        : parentCategoryId?.toString()
      
      return {
        id: sub.id,
        _id: sub._id.toString(),
        name: sub.name,
        parentCategoryId: parentCategoryIdStr,
        parentCategory: parentCategory,
        companyId: sub.companyId.toString(),
        status: sub.status,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      }
    })
    
    console.log('[API /subcategories] Mapped subcategories:', {
      count: mappedSubcategories.length,
      subcategories: mappedSubcategories.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        hasParentCategory: !!s.parentCategory,
        parentCategoryName: s.parentCategory?.name,
        parentCategoryId: s.parentCategoryId,
      }))
    })
    
    return NextResponse.json({
      success: true,
      subcategories: mappedSubcategories
    })
  } catch (error: any) {
    console.error('[API /subcategories] ❌ Error fetching subcategories:', error)
    console.error('[API /subcategories] Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subcategories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subcategories
 * Create a new subcategory (Company Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { companyId, parentCategoryId, name } = body
    
    if (!parentCategoryId || !name) {
      return NextResponse.json(
        { error: 'parentCategoryId and name are required' },
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
    const company = await mongoose.connection.db.collection('companies').findOne({
      $or: [
        { id: validatedCompanyId },
        { _id: mongoose.Types.ObjectId.isValid(validatedCompanyId) ? new mongoose.Types.ObjectId(validatedCompanyId) : null }
      ]
    })
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    // Find parent category
    let parentCategory = null
    if (mongoose.Types.ObjectId.isValid(parentCategoryId)) {
      parentCategory = await Category.findById(parentCategoryId)
    } else {
      parentCategory = await Category.findOne({ id: parentCategoryId })
    }
    
    if (!parentCategory) {
      return NextResponse.json(
        { error: 'Parent category not found' },
        { status: 404 }
      )
    }
    
    if (parentCategory.status !== 'active') {
      return NextResponse.json(
        { error: 'Parent category is not active' },
        { status: 400 }
      )
    }
    
    // Check if subcategory with same name already exists for this company and parent category
    const existing = await Subcategory.findOne({
      parentCategoryId: parentCategory._id,
      companyId: company._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Subcategory with this name already exists for this category and company' },
        { status: 409 }
      )
    }
    
    // Generate unique ID
    let subcategoryId = 600001
    while (await Subcategory.findOne({ id: subcategoryId.toString() })) {
      subcategoryId++
    }
    
    // Create subcategory
    const subcategory = await Subcategory.create({
      id: subcategoryId.toString(),
      name: name.trim(),
      parentCategoryId: parentCategory._id,
      companyId: company._id,
      status: 'active'
    })
    
    // Populate parent category for response
    await subcategory.populate('parentCategoryId', 'id name isSystemCategory')
    
    return NextResponse.json({
      success: true,
      subcategory: {
        id: subcategory.id,
        _id: subcategory._id.toString(),
        name: subcategory.name,
        parentCategoryId: subcategory.parentCategoryId.toString(),
        parentCategory: {
          id: (subcategory.parentCategoryId as any).id,
          name: (subcategory.parentCategoryId as any).name
        },
        companyId: subcategory.companyId.toString(),
        status: subcategory.status
      }
    })
  } catch (error: any) {
    console.error('Error creating subcategory:', error)
    
    // Handle duplicate key error
    if (error.code === 11000 || error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Subcategory with this name already exists for this category and company' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create subcategory' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/subcategories
 * Update a subcategory (Company Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { subcategoryId, name, status } = body
    
    if (!subcategoryId) {
      return NextResponse.json(
        { error: 'subcategoryId is required' },
        { status: 400 }
      )
    }
    
    // Find subcategory
    let subcategory = null
    if (mongoose.Types.ObjectId.isValid(subcategoryId)) {
      subcategory = await Subcategory.findById(subcategoryId)
    } else {
      subcategory = await Subcategory.findOne({ id: subcategoryId })
    }
    
    if (!subcategory) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      )
    }
    
    // Validate companyId from authenticated user context and ensure subcategory belongs to user's company
    try {
      const authContext = await validateAndGetCompanyId(request)
      if (subcategory.companyId.toString() !== authContext.companyId) {
        // Get company ObjectId for comparison
        if (!mongoose.connection.db) {
          return NextResponse.json(
            { error: 'Database connection not available' },
            { status: 500 }
          )
        }
        const company = await mongoose.connection.db.collection('companies').findOne({
          $or: [
            { id: authContext.companyId },
            { _id: mongoose.Types.ObjectId.isValid(authContext.companyId) ? new mongoose.Types.ObjectId(authContext.companyId) : null }
          ]
        })
        if (company && subcategory.companyId.toString() !== company._id.toString()) {
          return NextResponse.json(
            { error: 'Forbidden: Subcategory does not belong to your company' },
            { status: 403 }
          )
        }
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Update fields
    if (name !== undefined && name !== subcategory.name) {
      const trimmedName = name.trim()
      
      // Check if new name conflicts
      const existing = await Subcategory.findOne({
        parentCategoryId: subcategory.parentCategoryId,
        companyId: subcategory.companyId,
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        _id: { $ne: subcategory._id }
      })
      
      if (existing) {
        return NextResponse.json(
          { error: 'Subcategory with this name already exists for this category and company' },
          { status: 409 }
        )
      }
      
      subcategory.name = trimmedName
    }
    
    if (status !== undefined) {
      if (status !== 'active' && status !== 'inactive') {
        return NextResponse.json(
          { error: 'Status must be "active" or "inactive"' },
          { status: 400 }
        )
      }
      subcategory.status = status
    }
    
    await subcategory.save()
    await subcategory.populate('parentCategoryId', 'id name')
    
    return NextResponse.json({
      success: true,
      subcategory: {
        id: subcategory.id,
        _id: subcategory._id.toString(),
        name: subcategory.name,
        parentCategoryId: subcategory.parentCategoryId.toString(),
        companyId: subcategory.companyId.toString(),
        status: subcategory.status
      }
    })
  } catch (error: any) {
    console.error('Error updating subcategory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update subcategory' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/subcategories
 * Soft delete a subcategory (Company Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const subcategoryId = searchParams.get('subcategoryId')
    
    if (!subcategoryId) {
      return NextResponse.json(
        { error: 'subcategoryId is required' },
        { status: 400 }
      )
    }
    
    // Find subcategory
    let subcategory = null
    if (mongoose.Types.ObjectId.isValid(subcategoryId)) {
      subcategory = await Subcategory.findById(subcategoryId)
    } else {
      subcategory = await Subcategory.findOne({ id: subcategoryId })
    }
    
    if (!subcategory) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      )
    }
    
    // Validate companyId from authenticated user context and ensure subcategory belongs to user's company
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
          { _id: mongoose.Types.ObjectId.isValid(authContext.companyId) ? new mongoose.Types.ObjectId(authContext.companyId) : null }
        ]
      })
      if (company && subcategory.companyId.toString() !== company._id.toString()) {
        return NextResponse.json(
          { error: 'Forbidden: Subcategory does not belong to your company' },
          { status: 403 }
        )
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if subcategory has active product mappings
    const ProductSubcategoryMapping = mongoose.model('ProductSubcategoryMapping')
    const mappingCount = await ProductSubcategoryMapping.countDocuments({
      subCategoryId: subcategory._id
    })
    
    if (mappingCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete subcategory: ${mappingCount} product mapping(s) exist`,
          mappingCount 
        },
        { status: 409 }
      )
    }
    
    // Check if subcategory has active eligibilities
    const DesignationSubcategoryEligibility = mongoose.model('DesignationSubcategoryEligibility')
    const eligibilityCount = await DesignationSubcategoryEligibility.countDocuments({
      subCategoryId: subcategory._id,
      status: 'active'
    })
    
    if (eligibilityCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete subcategory: ${eligibilityCount} active eligibility(ies) exist`,
          eligibilityCount 
        },
        { status: 409 }
      )
    }
    
    // Soft delete
    subcategory.status = 'inactive'
    await subcategory.save()
    
    return NextResponse.json({
      success: true,
      message: 'Subcategory deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting subcategory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete subcategory' },
      { status: 500 }
    )
  }
}

