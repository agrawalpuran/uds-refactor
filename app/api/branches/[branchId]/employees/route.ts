import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Branch from '@/lib/models/Branch'
import Employee from '@/lib/models/Employee'
import mongoose from 'mongoose'

/**
 * GET /api/branches/[branchId]/employees
 * Get employees for a branch
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    await connectDB()

    const { branchId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Find branch - use string ID
    const branch = await Branch.findOne({ id: branchId })
    if (!branch) {
      return NextResponse.json(
        { error: `Branch not found: ${branchId}` },
        { status: 404 }
      )
    }

    const branchIdStr = branch.id

    // Find employees for the branch - use string IDs
    const employees = await Employee.find({
      $or: [
        { locationId: branchIdStr },
        { branchId: branchIdStr },
      ],
      status: 'active'
    })
    .limit(limit)
    .select('_id id employeeId firstName lastName email')
    .lean()

    return NextResponse.json(employees)
  } catch (error: any) {
    console.error('API Error in /api/branches/[branchId]/employees GET:', error)
    console.error('API Error in /api/branches/[branchId]/employees GET:', error)
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
    }
    
    // Return 404 for not found errors
    if (errorMessage.includes('not found') || 
        errorMessage.includes('Not found') || 
        errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    }
    
    // Return 401 for authentication errors
    if (errorMessage.includes('Unauthorized') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('token')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }
    
    // Return 500 for server errors
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
