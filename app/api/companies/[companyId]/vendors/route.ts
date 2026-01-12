
import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Company from '@/lib/models/Company'
import Vendor from '@/lib/models/Vendor'
import mongoose from 'mongoose'

/**
 * GET /api/companies/[companyId]/vendors
 * Get all vendors mapped/eligible for a company
 * Uses direct VendorCompany relationship mapping
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    await connectDB()

    const { companyId } = await params

    // Find company
    const company = await Company.findOne({ id: companyId })
    if (!company) {
      return NextResponse.json(
        { error: `Company not found: ${companyId}` },
        { status: 404 }
      )
    }
    
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Get vendors directly from VendorCompany relationship mapping - use string ID
    const { VendorCompany } = await import('@/lib/models/Relationship')
    
    // Query VendorCompany relationships using string ID
    const vendorCompanyLinks = await VendorCompany.find({
      companyId: company.id
    }).lean()

    if (vendorCompanyLinks.length === 0) {
      console.log(
        `[vendors API] No direct VendorCompany relationships found for company ${company.id}. Deriving from ProductCompany + ProductVendor...`
      )
      
      // Fallback: Try to derive from ProductCompany + ProductVendor relationships
      const { ProductCompany, ProductVendor } = await import('@/lib/models/Relationship')
      
      const productCompanyLinks = await ProductCompany.find({
        companyId: company.id
      }).lean()

      console.log(
        `[vendors API] Found ${productCompanyLinks.length} ProductCompany links for company ${company.id}`
      )

      if (productCompanyLinks.length === 0) {
        console.log(`[vendors API] No products linked to company ${company.id}`)
        return NextResponse.json([])
      }

      // Get product string IDs from ProductCompany links
      const productIds = productCompanyLinks
        .map(pc => String(pc.productId || pc.uniformId))
        .filter(Boolean)

      console.log(`[vendors API] Looking for vendors for ${productIds.length} products`)

      // Query ProductVendor using string product IDs
      const productVendorLinks = await ProductVendor.find({
        productId: { $in: productIds }
      }).lean()

      console.log(`[vendors API] Found ${productVendorLinks.length} ProductVendor links`)

      // Extract vendor string IDs
      const vendorIds = Array.from(
        new Set(productVendorLinks.map(pv => String(pv.vendorId)).filter(Boolean))
      )

      console.log(`[vendors API] Unique vendor IDs: ${vendorIds.length}`)

      if (vendorIds.length === 0) {
        console.log(
          `[vendors API] No vendors found for products linked to company ${company.id}`
        )
        return NextResponse.json([])
      }

      // Query vendors by string ID
      const vendors = await Vendor.find({
        id: { $in: vendorIds }
      }).lean()

      console.log(`[vendors API] Found ${vendors.length} vendor documents`)

      const formattedVendors = vendors.map(vendor => ({
        id: vendor.id,
        name: vendor.name
      }))

      return NextResponse.json(formattedVendors)
    }
    
    console.log(
      `[vendors API] Found ${vendorCompanyLinks.length} direct VendorCompany relationships`
    )

    // Extract vendor string IDs from VendorCompany relationships
    const vendorIds = vendorCompanyLinks
      .map(vc => String(vc.vendorId))
      .filter(Boolean)

    console.log(
      `[vendors API] Extracted ${vendorIds.length} vendor IDs from VendorCompany relationships`
    )

    // Get vendor details - use string IDs
    const vendors = await Vendor.find({
      id: { $in: vendorIds }
    }).lean()
    
    console.log(`[vendors API] Found ${vendors.length} vendor documents`)

    // Format vendors
    const formattedVendors = vendors.map(vendor => ({
      id: vendor.id,
      name: vendor.name
    }))

    return NextResponse.json(formattedVendors)

  } catch (error: any) {
    console.error('API Error in /api/companies/[companyId]/vendors GET:', error)
    const errorMessage =
      error?.message || error?.toString() || 'Internal server error'
    
    if (
      errorMessage.includes('required') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('missing') ||
      errorMessage.includes('Invalid JSON')
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    
    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('Not found') ||
      errorMessage.includes('does not exist')
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 404 })
    }
    
    if (
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('token')
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 401 })
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
