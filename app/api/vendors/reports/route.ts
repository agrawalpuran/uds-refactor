import { NextRequest, NextResponse } from 'next/server'
import { getVendorReports, getVendorSalesPatterns, getVendorOrderStatusBreakdown, getVendorBusinessVolumeByCompany } from '@/lib/db/data-access'
import connectDB from '@/lib/db/mongodb'


// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const vendorId = searchParams.get('vendorId')
    const reportType = searchParams.get('type') // 'full', 'sales-patterns', 'order-status', 'business-volume'
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | null

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    // Return full comprehensive report by default
    if (!reportType || reportType === 'full') {
      const reports = await getVendorReports(vendorId)
      return NextResponse.json(reports)
    }

    // Return specific report type
    if (reportType === 'sales-patterns') {
      const patterns = await getVendorSalesPatterns(vendorId, period || 'monthly')
      return NextResponse.json({ patterns, period: period || 'monthly' })
    }

    if (reportType === 'order-status') {
      const breakdown = await getVendorOrderStatusBreakdown(vendorId)
      return NextResponse.json({ breakdown })
    }

    if (reportType === 'business-volume') {
      const volume = await getVendorBusinessVolumeByCompany(vendorId)
      return NextResponse.json({ volume })
    }

    return NextResponse.json(
      { error: 'Invalid report type. Use: full, sales-patterns, order-status, or business-volume' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendor reports' },
      { status: 500 }
    )
  }
}

