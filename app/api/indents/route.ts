import { NextResponse } from 'next/server'
import {
  createIndentHeader,
  getIndentById,
  getVendorIndentsByIndentId,
} from '@/lib/db/indent-workflow'
import { isCompanyAdmin } from '@/lib/db/data-access'


// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      client_indent_number,
      indent_date,
      companyId,
      site_id,
      created_by_user_id,
      created_by_role,
      adminEmail, // For authorization
    } = body

    // Validate required fields
    if (!client_indent_number || !indent_date || !companyId || !created_by_user_id || !created_by_role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Authorization check (only Company Admin or Site Admin can create indents)
    if (created_by_role === 'COMPANY_ADMIN' && adminEmail) {
      const isAdmin = await isCompanyAdmin(adminEmail, companyId)
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized: Only Company Admins can create indents' },
          { status: 403 }
        )
      }
    }

    const indent = await createIndentHeader({
      client_indent_number,
      indent_date: new Date(indent_date),
      companyId,
      site_id,
      created_by_user_id,
      created_by_role,
    })

    return NextResponse.json({ success: true, indent }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating indent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create indent' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const indentId = searchParams.get('indentId')

    if (!indentId) {
      return NextResponse.json(
        { error: 'indentId is required' },
        { status: 400 }
      )
    }

    const indent = await getIndentById(indentId)
    
    if (!indent) {
      return NextResponse.json(
        { error: 'Indent not found' },
        { status: 404 }
      )
    }

    // Get vendor indents
    const vendorIndents = await getVendorIndentsByIndentId(indentId)

    return NextResponse.json({
      success: true,
      indent,
      vendorIndents,
    })
  } catch (error: any) {
    console.error('Error fetching indent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch indent' },
      { status: 500 }
    )
  }
}

