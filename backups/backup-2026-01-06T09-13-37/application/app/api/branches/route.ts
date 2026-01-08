import { NextResponse } from 'next/server'
import { 
  getAllBranches, 
  getBranchById, 
  getBranchesByCompany, 
  getEmployeesByBranch,
  isBranchAdmin,
  getBranchByAdminEmail,
  getEmployeeByEmail,
  createBranch,
  updateBranch,
  deleteBranch,
  isCompanyAdmin
} from '@/lib/db/data-access'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const companyId = searchParams.get('companyId')
    const employees = searchParams.get('employees') === 'true'
    const checkAdmin = searchParams.get('checkAdmin') === 'true'
    const getByAdminEmail = searchParams.get('getByAdminEmail') === 'true'
    const email = searchParams.get('email')

    // Check if employee is a branch admin
    if (checkAdmin && email && branchId) {
      const isAdmin = await isBranchAdmin(email, branchId)
      return NextResponse.json({ isBranchAdmin: isAdmin })
    }

    // Get branch by admin email
    if (getByAdminEmail && email) {
      const branch = await getBranchByAdminEmail(email)
      // Return 200 with null instead of 404 - 404 is expected when user is not a branch admin
      // This prevents console errors for normal cases
      return NextResponse.json(branch || null, { status: 200 })
    }

    if (branchId) {
      const branch = await getBranchById(branchId)
      if (!branch) {
        return NextResponse.json(null, { status: 404 })
      }
      
      // If employees requested, get employees for this branch
      if (employees) {
        const branchEmployees = await getEmployeesByBranch(branchId)
        return NextResponse.json({ ...branch, employees: branchEmployees })
      }
      
      return NextResponse.json(branch)
    }

    if (companyId) {
      const branches = await getBranchesByCompany(companyId)
      return NextResponse.json(branches)
    }

    const branches = await getAllBranches()
    return NextResponse.json(branches)
  } catch (error: any) {
    console.error('API Error in /api/branches:', error)
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
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.companyId) {
      return NextResponse.json({ 
        error: 'Branch name and companyId are required'
      }, { status: 400 })
    }
    
    if (!body.address_line_1 || !body.city || !body.state || !body.pincode) {
      return NextResponse.json({ 
        error: 'Address fields (address_line_1, city, state, pincode) are required'
      }, { status: 400 })
    }
    
    const branch = await createBranch({
      name: body.name,
      companyId: body.companyId,
      adminId: body.adminId,
      address_line_1: body.address_line_1,
      address_line_2: body.address_line_2,
      address_line_3: body.address_line_3,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      country: body.country || 'India',
      phone: body.phone,
      email: body.email,
      status: body.status || 'active',
    })
    
    return NextResponse.json(branch, { status: 201 })
  } catch (error: any) {
    console.error('API Error creating branch:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create branch'
    }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    // Extract adminEmail for authorization (logged-in user's email)
    // email in updateData is the branch's contact email
    const { branchId, adminEmail, email, ...updateData } = body
    
    if (!branchId) {
      return NextResponse.json({ 
        error: 'Branch ID is required'
      }, { status: 400 })
    }

    if (!adminEmail) {
      return NextResponse.json({ 
        error: 'Admin email is required for authorization'
      }, { status: 401 })
    }

    // Get branch to find its company
    const branch = await getBranchById(branchId)
    if (!branch) {
      return NextResponse.json({ 
        error: 'Branch not found'
      }, { status: 404 })
    }

    // Verify authorization: user must be Company Admin of the branch's company
    // Use adminEmail (logged-in user's email) for authorization check
    const companyId = branch.companyId?.id || branch.companyId
    if (!companyId) {
      return NextResponse.json({ 
        error: 'Branch has no associated company'
      }, { status: 400 })
    }

    const isAdmin = await isCompanyAdmin(adminEmail, companyId)
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized: Only Company Admins can update branches'
      }, { status: 403 })
    }
    
    // Include email (branch's contact email) in updateData if provided
    const finalUpdateData = email ? { ...updateData, email } : updateData
    const updatedBranch = await updateBranch(branchId, finalUpdateData)
    
    return NextResponse.json(updatedBranch)
  } catch (error: any) {
    console.error('API Error updating branch:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to update branch'
    }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    
    if (!branchId) {
      return NextResponse.json({ 
        error: 'Branch ID is required'
      }, { status: 400 })
    }
    
    await deleteBranch(branchId)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Error deleting branch:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to delete branch'
    }, { status: 400 })
  }
}

