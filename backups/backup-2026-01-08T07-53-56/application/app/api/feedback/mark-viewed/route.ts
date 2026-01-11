import { NextResponse } from 'next/server'
import { markFeedbackAsViewed, getCompanyByAdminEmail } from '@/lib/db/data-access'


// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyId, adminEmail } = body
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }
    
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin email is required' },
        { status: 400 }
      )
    }
    
    // Validate that the admin has access to this company
    const company = await getCompanyByAdminEmail(adminEmail.trim().toLowerCase())
    if (!company) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin email not found or not a Company Admin' },
        { status: 403 }
      )
    }
    
    // Verify the companyId matches the admin's company
    // Normalize both IDs to strings for comparison
    const companyIdStr = String(company.id || company._id?.toString() || '')
    const requestCompanyIdStr = String(companyId || '')
    
    if (companyIdStr !== requestCompanyIdStr && company._id?.toString() !== requestCompanyIdStr) {
      return NextResponse.json(
        { error: 'Forbidden: Admin does not have access to this company' },
        { status: 403 }
      )
    }
    
    // Use the validated company ID (from company object, not request)
    const validatedCompanyId = company.id || company._id?.toString() || companyId
    
    // Mark feedback as viewed
    await markFeedbackAsViewed(validatedCompanyId, adminEmail)
    
    return NextResponse.json({ success: true, message: 'Feedback marked as viewed' })
  } catch (error: any) {
    console.error('Error marking feedback as viewed:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to mark feedback as viewed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

