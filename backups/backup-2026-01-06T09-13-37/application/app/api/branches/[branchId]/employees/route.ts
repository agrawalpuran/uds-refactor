import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Branch from '@/lib/models/Branch'
import Employee from '@/lib/models/Employee'
import mongoose from 'mongoose'

/**
 * GET /api/branches/[branchId]/employees
 * Get employees for a branch
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    await connectDB()

    const { branchId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

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

    const branchObjectId = branch._id

    // Find employees for the branch
    const employees = await Employee.find({
      $or: [
        { locationId: branchObjectId },
        { branchId: branchObjectId },
      ],
      status: 'active'
    })
    .limit(limit)
    .select('_id id employeeId firstName lastName email')
    .lean()

    return NextResponse.json(employees)
  } catch (error: any) {
    console.error('API Error in /api/branches/[branchId]/employees GET:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error'
      },
      { status: 500 }
    )
  }
}

