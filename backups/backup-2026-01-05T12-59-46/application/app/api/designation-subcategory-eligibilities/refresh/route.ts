/**
 * POST /api/designation-subcategory-eligibilities/refresh
 * Refresh employee eligibility based on subcategory-based designation eligibility
 * 
 * This endpoint recomputes eligibility for all employees with a specific designation
 * based on the subcategory-level eligibility rules.
 */

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import mongoose from 'mongoose'
import DesignationSubcategoryEligibility from '@/lib/models/DesignationSubcategoryEligibility'
import Subcategory from '@/lib/models/Subcategory'
import Category from '@/lib/models/Category'
import Employee from '@/lib/models/Employee'
import Company from '@/lib/models/Company'
import { validateAndGetCompanyId } from '@/lib/utils/api-auth'
import { decrypt } from '@/lib/utils/encryption'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { companyId, designationId, gender = 'unisex' } = body
    
    if (!companyId || !designationId) {
      return NextResponse.json(
        { error: 'companyId and designationId are required' },
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
    
    // Get all active designation-subcategory eligibilities for this designation, company, and gender
    const eligibilities = await DesignationSubcategoryEligibility.find({
      companyId: company._id,
      designationId: designationId.trim(),
      gender: gender === 'unisex' ? { $in: ['male', 'female', 'unisex'] } : gender,
      status: 'active'
    })
      .lean()
    
    if (eligibilities.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No active eligibility rules found for designation "${designationId}" and gender "${gender}"`,
        employeesUpdated: 0
      })
    }
    
    // Get all subcategory IDs
    const subcategoryIds = eligibilities
      .map(e => e.subCategoryId)
      .filter(Boolean)
      .map((s: any) => {
        if (mongoose.Types.ObjectId.isValid(s)) {
          return new mongoose.Types.ObjectId(s)
        }
        return s
      })
    
    // Get all subcategories with their parent categories
    const subcategories = await Subcategory.find({
      _id: { $in: subcategoryIds },
      companyId: company._id,
      status: 'active'
    })
      .populate('parentCategoryId', 'id name')
      .lean()
    
    // Create a map: subcategoryId -> subcategory data
    const subcategoryMapById = new Map()
    for (const subcat of subcategories) {
      const subcatId = (subcat as any)._id.toString()
      subcategoryMapById.set(subcatId, subcat)
    }
    
    // Aggregate eligibility by parent category
    const categoryEligibility: Record<string, { quantity: number; renewalFrequency: number }> = {}
    
    for (const elig of eligibilities) {
      const subcatId = elig.subCategoryId?.toString()
      const subcat = subcategoryMapById.get(subcatId)
      
      if (subcat && (subcat as any).parentCategoryId) {
        const parentCategory = (subcat as any).parentCategoryId
        const categoryName = parentCategory.name?.toLowerCase() || ''
        
        // Map category name to legacy format (shirt, pant, shoe, jacket)
        const categoryKey = mapCategoryNameToLegacy(categoryName)
        
        if (categoryKey) {
          if (!categoryEligibility[categoryKey]) {
            categoryEligibility[categoryKey] = { quantity: 0, renewalFrequency: 6 }
          }
          
          // Sum quantities for same category (multiple subcategories can map to same category)
          categoryEligibility[categoryKey].quantity += elig.quantity || 0
          
          // Use maximum renewal frequency (convert years to months)
          const renewalFrequency = elig.renewalFrequency || 6
          const renewalUnit = elig.renewalUnit || 'months'
          const frequencyMonths = renewalUnit === 'years' ? renewalFrequency * 12 : renewalFrequency
          categoryEligibility[categoryKey].renewalFrequency = Math.max(
            categoryEligibility[categoryKey].renewalFrequency,
            frequencyMonths
          )
        }
      }
    }
    
    // Find all employees with this designation and company
    const allEmployees = await Employee.find({ companyId: company._id }).lean()
    
    // Filter employees by designation (handle encryption)
    const matchingEmployees: any[] = []
    for (const emp of allEmployees) {
      let empDesignation = emp.designation
      if (empDesignation && typeof empDesignation === 'string' && empDesignation.includes(':')) {
        try {
          empDesignation = decrypt(empDesignation)
        } catch (error) {
          continue
        }
      }
      
      // Check if designation matches (case-insensitive)
      if (empDesignation && empDesignation.trim().toLowerCase() === designationId.trim().toLowerCase()) {
        // Check gender filter
        if (gender === 'unisex' || !gender || emp.gender === gender) {
          matchingEmployees.push(emp)
        }
      }
    }
    
    if (matchingEmployees.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No employees found with designation "${designationId}" and gender "${gender || 'all'}"`,
        employeesUpdated: 0
      })
    }
    
    // Update employee eligibility
    let updatedCount = 0
    for (const emp of matchingEmployees) {
      try {
        const employee = await Employee.findById(emp._id)
        if (employee) {
          // Reset eligibility to defaults
          employee.eligibility = {
            shirt: 0,
            pant: 0,
            shoe: 0,
            jacket: 0
          }
          
          employee.cycleDuration = {
            shirt: 6,
            pant: 6,
            shoe: 6,
            jacket: 12
          }
          
          // Apply new eligibility from subcategories
          for (const [categoryKey, data] of Object.entries(categoryEligibility)) {
            if (categoryKey === 'shirt') {
              employee.eligibility.shirt = data.quantity
              employee.cycleDuration.shirt = data.renewalFrequency
            } else if (categoryKey === 'pant' || categoryKey === 'trouser') {
              employee.eligibility.pant = data.quantity
              employee.cycleDuration.pant = data.renewalFrequency
            } else if (categoryKey === 'shoe') {
              employee.eligibility.shoe = data.quantity
              employee.cycleDuration.shoe = data.renewalFrequency
            } else if (categoryKey === 'jacket' || categoryKey === 'blazer') {
              employee.eligibility.jacket = data.quantity
              employee.cycleDuration.jacket = data.renewalFrequency
            }
          }
          
          await employee.save()
          updatedCount++
        }
      } catch (error: any) {
        console.error(`Error updating employee ${emp.id || emp.employeeId}:`, error)
        // Continue with other employees
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully refreshed eligibility for ${updatedCount} employee(s)`,
      employeesUpdated: updatedCount
    })
    
  } catch (error: any) {
    console.error('Error refreshing employee eligibility:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to refresh employee eligibility' },
      { status: 500 }
    )
  }
}

/**
 * Map category name to legacy format (shirt, pant, shoe, jacket)
 */
function mapCategoryNameToLegacy(categoryName: string): string | null {
  if (!categoryName) return null
  
  const lower = categoryName.toLowerCase().trim()
  
  // Direct matches
  if (lower === 'shirt' || lower === 'shirts') return 'shirt'
  if (lower === 'pant' || lower === 'pants' || lower === 'trouser' || lower === 'trousers') return 'pant'
  if (lower === 'shoe' || lower === 'shoes') return 'shoe'
  if (lower === 'jacket' || lower === 'jackets' || lower === 'blazer' || lower === 'blazers') return 'jacket'
  
  // Partial matches
  if (lower.includes('shirt')) return 'shirt'
  if (lower.includes('pant') || lower.includes('trouser')) return 'pant'
  if (lower.includes('shoe')) return 'shoe'
  if (lower.includes('jacket') || lower.includes('blazer')) return 'jacket'
  
  return null
}

