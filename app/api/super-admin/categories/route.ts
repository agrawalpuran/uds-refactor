/**
 * Super Admin Category Management APIs
 * 
 * Categories are GLOBAL and managed by Super Admin only.
 * These categories serve as parent categories for company-specific subcategories.
 */

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Category from '@/lib/models/Category'
import mongoose from 'mongoose'

/**
 * GET /api/super-admin/categories
 * Get all categories (global)
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // Optional: 'active' | 'inactive' | null (all)
    
    const query: any = {}
    if (status === 'active' || status === 'inactive') {
      query.status = status
    }
    
    const categories = await Category.find(query)
      .sort({ name: 1 })
      .lean()
    
    return NextResponse.json({
      success: true,
      categories: categories.map(cat => ({
        id: cat.id,
        _id: cat._id.toString(),
        name: cat.name,
        isSystemCategory: cat.isSystemCategory,
        status: cat.status,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      }))
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    console.error('Error fetching categories:', error)
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    
    // Return 400 for validation/input errors
    if (errorMessage.includes('required') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('missing') ||
        errorMessage.includes('Invalid JSON')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    
    // Return 404 for not found errors
    if (errorMessage.includes('not found') || 
        errorMessage.includes('Not found') || 
        errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    
    // Return 401 for authentication errors
    if (errorMessage.includes('Unauthorized') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('token')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    
    // Return 500 for server errors
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/super-admin/categories
 * Create a new category (Super Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check
    // For now, allow creation but add validation
    
    await connectDB()
    
    // Parse JSON body with error handling
    let body: any
    try {
      body = await request.json()
    } catch (jsonError: any) {
      return NextResponse.json({
        error: 'Invalid JSON in request body'
      }, { status: 400 })
    const { name, isSystemCategory = false } = body
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    
    const trimmedName = name.trim()
    
    // Check if category with same name already exists (case-insensitive)
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    
    // Generate unique ID
    }
    let categoryId = 500001
    while (await Category.findOne({ id: categoryId.toString() })) {
      categoryId++
    }
    
    // Create category
    const category = await Category.create({
      id: categoryId.toString(),
      name: trimmedName,
      isSystemCategory: isSystemCategory === true,
      status: 'active'
    })
    
    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        _id: category._id.toString(),
        name: category.name,
        isSystemCategory: category.isSystemCategory,
        status: category.status
      }
    })
  } catch (error: any) {
    console.error('Error creating category:', error)
    
    // Handle duplicate key error
    if (error.code === 11000 || error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    )
}

/**
 * PUT /api/super-admin/categories
 * Update a category (Super Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check
    
    await connectDB()
    
    // Parse JSON body with error handling
    let body: any
    try {
      body = await request.json()
    } catch (jsonError: any) {
      return NextResponse.json({
        error: 'Invalid JSON in request body'
      }, { status: 400 })
    const { categoryId, name, status } = body
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    
    // Find category - use string ID
    }
    const category = await Category.findOne({ id: categoryId })
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    
    // Update fields
    if (name !== undefined && name !== category.name) {
      const trimmedName = name.trim()
      
      // Check if new name conflicts with existing category - use string ID
    }
    const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        id: { $ne: category.id }
      })
      
      if (existing) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 409 }
        )
      
      category.name = trimmedName
    }
    
    if (status !== undefined) {
      if (status !== 'active' && status !== 'inactive') {
        return NextResponse.json(
          { error: 'Status must be "active" or "inactive"' },
          { status: 400 }
        )
      category.status = status
    }
    
    await category.save()
    
    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        _id: category._id.toString(),
        name: category.name,
        isSystemCategory: category.isSystemCategory,
        status: category.status
      }
    })
  } catch (error: any) {
    console.error('Error updating category:', error)
    console.error('Error updating category:', error)
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    
    // Return 400 for validation/input errors
    if (errorMessage.includes('required') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('missing') ||
        errorMessage.includes('Invalid JSON')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    
    // Return 404 for not found errors
    if (errorMessage.includes('not found') || 
        errorMessage.includes('Not found') || 
        errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    
    // Return 401 for authentication errors
    if (errorMessage.includes('Unauthorized') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('token')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    
    // Return 500 for server errors
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/super-admin/categories
 * Soft delete a category (Super Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check
    
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    
    // Find category - use string ID
    }
    const category = await Category.findOne({ id: categoryId })
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    
    // Don't allow deleting system categories
    }
    if (category.isSystemCategory) {
      return NextResponse.json(
        { error: 'Cannot delete system categories' },
        { status: 403 }
      )
    
    // Check if category has active subcategories - use string ID
    const Subcategory = mongoose.model('Subcategory')
    const subcategoryCount = await Subcategory.countDocuments({
      parentCategoryId: category.id,
      status: 'active'
    })
    
    if (subcategoryCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete category: ${subcategoryCount} active subcategory(ies) exist`,
          subcategoryCount 
        },
        { status: 409 }
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
    console.error('Error deleting category:', error)
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    
    // Return 400 for validation/input errors
    if (errorMessage.includes('required') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('missing') ||
        errorMessage.includes('Invalid JSON')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    
    // Return 404 for not found errors
    if (errorMessage.includes('not found') || 
        errorMessage.includes('Not found') || 
        errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    
    // Return 401 for authentication errors
    if (errorMessage.includes('Unauthorized') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('token')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    
    // Return 500 for server errors
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

}
