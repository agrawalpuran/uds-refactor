import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import ProductCategory from '@/lib/models/ProductCategory'
import mongoose from 'mongoose'
import {
  getCategoriesByCompany,
  getCategoryByIdOrName,
  ensureSystemCategories
} from '@/lib/db/category-helpers'

/**
 * GET /api/categories
 * Get all categories for a company
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      )
    }
    
    // Ensure system categories exist
    await ensureSystemCategories(companyId)
    
    // Get all categories
    const categories = await getCategoriesByCompany(companyId)
    
    return NextResponse.json({
      success: true,
      categories
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { companyId, name, renewalUnit = 'months' } = body
    
    if (!companyId || !name) {
      return NextResponse.json(
        { error: 'companyId and name are required' },
        { status: 400 }
      )
    }
    
    // Get company
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    const company = await mongoose.connection.db.collection('companies').findOne({
      $or: [
        { id: companyId },
        ...(mongoose.Types.ObjectId.isValid(companyId) ? [{ _id: new mongoose.Types.ObjectId(companyId) }] : [])
      ]
    })
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    // Check if category with same name already exists
    const existing = await ProductCategory.findOne({
      companyId: company._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    }
    
    // Generate unique ID
    let categoryId = 500001
    while (await ProductCategory.findOne({ id: categoryId.toString() })) {
      categoryId++
    }
    
    // Create category
    const category = await ProductCategory.create({
      id: categoryId.toString(),
      name: name.trim(),
      companyId: company._id,
      renewalUnit: renewalUnit === 'years' ? 'years' : 'months',
      isSystemCategory: false,
      status: 'active'
    })
    
    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        _id: category._id.toString(),
        name: category.name,
        companyId: category.companyId.toString(),
        renewalUnit: category.renewalUnit,
        isSystemCategory: category.isSystemCategory,
        status: category.status
      }
    })
  } catch (error: any) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/categories
 * Update a category
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { categoryId, name, renewalUnit, status } = body
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    }
    
    // Find category
    let category = null
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      category = await ProductCategory.findById(categoryId)
    } else {
      category = await ProductCategory.findOne({ id: categoryId })
    }
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Update fields
    if (name !== undefined) {
      category.name = name.trim()
    }
    if (renewalUnit !== undefined) {
      category.renewalUnit = renewalUnit === 'years' ? 'years' : 'months'
    }
    if (status !== undefined) {
      category.status = status === 'inactive' ? 'inactive' : 'active'
    }
    
    await category.save()
    
    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        _id: category._id.toString(),
        name: category.name,
        companyId: category.companyId.toString(),
        renewalUnit: category.renewalUnit,
        isSystemCategory: category.isSystemCategory,
        status: category.status
      }
    })
  } catch (error: any) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories
 * Delete a category (soft delete by setting status to inactive)
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    }
    
    // Find category
    let category = null
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      category = await ProductCategory.findById(categoryId)
    } else {
      category = await ProductCategory.findOne({ id: categoryId })
    }
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Don't allow deleting system categories
    if (category.isSystemCategory) {
      return NextResponse.json(
        { error: 'Cannot delete system categories' },
        { status: 403 }
      )
    }
    
    // Soft delete
    category.status = 'inactive'
    await category.save()
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    )
  }
}

