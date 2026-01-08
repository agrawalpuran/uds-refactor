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

    // Get vendors directly from VendorCompany relationship mapping
    const vendorCompanyCollection = db.collection('vendorcompanies')
    
    // Try multiple ways to find VendorCompany relationships
    let vendorCompanyLinks: any[] = []
    
    // Method 1: Direct ObjectId match
    try {
      vendorCompanyLinks = await vendorCompanyCollection.find({
        companyId: company._id
      }).toArray()
    } catch (error) {
      console.warn('Error querying vendorcompanies with ObjectId:', error)
    }
    
    // Method 2: Try with ObjectId conversion
    if (vendorCompanyLinks.length === 0) {
      try {
        vendorCompanyLinks = await vendorCompanyCollection.find({
          companyId: new mongoose.Types.ObjectId(company._id.toString())
        }).toArray()
      } catch (error) {
        console.warn('Error querying vendorcompanies with converted ObjectId:', error)
      }
    }
    
    // Method 3: Try with company string ID (if stored as string)
    if (vendorCompanyLinks.length === 0 && company.id) {
      try {
        vendorCompanyLinks = await vendorCompanyCollection.find({
          companyId: company.id
        }).toArray()
      } catch (error) {
        console.warn('Error querying vendorcompanies with string ID:', error)
      }
    }
    
    // Method 4: Get all and filter manually (handles any format)
    if (vendorCompanyLinks.length === 0) {
      try {
        const allVendorCompanies = await vendorCompanyCollection.find({}).toArray()
        const companyIdStr = company._id.toString()
        const companyIdNum = company.id
        
        vendorCompanyLinks = allVendorCompanies.filter((vc: any) => {
          if (!vc.companyId) return false
          
          const vcCompanyId = vc.companyId
          const vcCompanyIdStr = vcCompanyId?.toString() || vcCompanyId
          
          // Match by ObjectId string
          if (vcCompanyIdStr === companyIdStr) return true
          
          // Match by company numeric ID
          if (companyIdNum && vcCompanyIdStr === companyIdNum) return true
          
          // Match if it's an ObjectId that matches
          if (vcCompanyId instanceof mongoose.Types.ObjectId) {
            if (vcCompanyId.toString() === companyIdStr) return true
          }
          
          // Match if companyId is stored as ObjectId in different format
          if (typeof vcCompanyId === 'object' && vcCompanyId.toString) {
            if (vcCompanyId.toString() === companyIdStr) return true
          }
          
          return false
        })
        
        console.log(`Found ${vendorCompanyLinks.length} vendor-company relationships for company ${company.id} (${company.name})`)
      } catch (error) {
        console.error('Error filtering vendorcompanies:', error)
      }
    }

    if (vendorCompanyLinks.length === 0) {
      console.log(`[vendors API] No direct VendorCompany relationships found for company ${company.id}. Deriving from ProductCompany + ProductVendor...`)
      
      // Fallback: Try to derive from ProductCompany + ProductVendor relationships
      const { ProductCompany, ProductVendor } = await import('@/lib/models/Relationship')
      
      const productCompanyLinks = await ProductCompany.find({
        companyId: company._id
      }).lean()

      console.log(`[vendors API] Found ${productCompanyLinks.length} ProductCompany links for company ${company.id}`)

      if (productCompanyLinks.length === 0) {
        console.log(`[vendors API] No products linked to company ${company.id}`)
        return NextResponse.json([])
      }

      const productIds = productCompanyLinks.map(pc => pc.productId || pc.uniformId)
      console.log(`[vendors API] Looking for vendors for ${productIds.length} products`)

      const productVendorLinks = await ProductVendor.find({
        productId: { $in: productIds }
      }).lean()

      console.log(`[vendors API] Found ${productVendorLinks.length} ProductVendor links`)

      const vendorIds = Array.from(new Set(productVendorLinks.map(pv => pv.vendorId)))

      console.log(`[vendors API] Unique vendor IDs: ${vendorIds.length}`)
      console.log(`[vendors API] Sample vendor IDs:`, vendorIds.slice(0, 3).map(id => ({
        id,
        type: typeof id,
        isObjectId: id instanceof mongoose.Types.ObjectId,
        stringValue: id?.toString()
      })))

      if (vendorIds.length === 0) {
        console.log(`[vendors API] No vendors found for products linked to company ${company.id}`)
        return NextResponse.json([])
      }

      // Convert vendor IDs to ObjectIds for querying
      const vendorObjectIds = vendorIds.map(vid => {
        if (vid instanceof mongoose.Types.ObjectId) {
          return vid
        }
        if (mongoose.Types.ObjectId.isValid(vid)) {
          return new mongoose.Types.ObjectId(vid)
        }
        return vid
      }).filter(Boolean)

      console.log(`[vendors API] Querying vendors with ${vendorObjectIds.length} ObjectIds`)

      // Try using Vendor model first (handles ObjectId matching better)
      let vendors: any[] = await Vendor.find({
        _id: { $in: vendorObjectIds }
      }).lean()

      console.log(`[vendors API] Found ${vendors.length} vendor documents using Vendor model`)

      // If no results, try raw collection query
      if (vendors.length === 0) {
        console.log(`[vendors API] Trying raw collection query...`)
        vendors = await db.collection('vendors').find({
          _id: { $in: vendorObjectIds }
        }).toArray()
        console.log(`[vendors API] Found ${vendors.length} vendor documents by _id (raw)`)
      }

      // If still no results, try querying by 'id' field (string ID like "100001")
      if (vendors.length === 0) {
        console.log(`[vendors API] Trying to query by 'id' field...`)
        const vendorStringIds = vendorIds.map(vid => {
          if (vid instanceof mongoose.Types.ObjectId) {
            return vid.toString()
          }
          return vid?.toString() || vid
        }).filter(Boolean)

        vendors = await Vendor.find({
          id: { $in: vendorStringIds }
        }).lean()

        if (vendors.length === 0) {
          vendors = await db.collection('vendors').find({
            id: { $in: vendorStringIds }
          }).toArray()
        }

        console.log(`[vendors API] Found ${vendors.length} vendor documents by 'id' field`)
      }

      // Last resort: Get all vendors and filter manually
      if (vendors.length === 0) {
        console.log(`[vendors API] Last resort: Getting all vendors and filtering...`)
        const allVendors = await Vendor.find({}).limit(1000).lean()
        const vendorIdStrings = new Set(vendorIds.map(vid => vid?.toString() || vid))
        
        vendors = allVendors.filter((v: any) => {
          const vIdStr = v._id?.toString() || v._id
          const vStringId = v.id?.toString() || v.id
          return vendorIdStrings.has(vIdStr) || vendorIdStrings.has(vStringId)
        })

        console.log(`[vendors API] Found ${vendors.length} vendor documents after filtering all vendors`)
      }

      const formattedVendors = vendors.map(vendor => ({
        id: vendor.id || vendor._id.toString(),
        name: vendor.name,
        _id: vendor._id.toString()
      }))

      return NextResponse.json(formattedVendors)
    }
    
    console.log(`[vendors API] Found ${vendorCompanyLinks.length} direct VendorCompany relationships`)

    // Extract vendor IDs from VendorCompany relationships
    const vendorIds = vendorCompanyLinks.map(vc => {
      // Handle both ObjectId and string formats
      if (vc.vendorId instanceof mongoose.Types.ObjectId) {
        return vc.vendorId
      }
      if (mongoose.Types.ObjectId.isValid(vc.vendorId)) {
        return new mongoose.Types.ObjectId(vc.vendorId)
      }
      return vc.vendorId
    }).filter(Boolean)

    console.log(`[vendors API] Extracted ${vendorIds.length} vendor IDs from VendorCompany relationships`)

    // Get vendor details - try both ObjectId and string ID matching
    let vendors: any[] = await db.collection('vendors').find({
      _id: { $in: vendorIds }
    }).toArray()
    
    // If no results, try matching by string ID field
    if (vendors.length === 0) {
      const vendorStringIds = vendorIds.map(id => id.toString())
      vendors = await db.collection('vendors').find({
        $or: [
          { _id: { $in: vendorIds } },
          { id: { $in: vendorStringIds } }
        ]
      }).toArray()
    }
    
    console.log(`[vendors API] Found ${vendors.length} vendor documents`)

    // Format vendors
    const formattedVendors = vendors.map(vendor => ({
      id: vendor.id || vendor._id.toString(),
      name: vendor.name,
      _id: vendor._id.toString()
    }))

    return NextResponse.json(formattedVendors)
  } catch (error: any) {
    console.error('API Error in /api/companies/[companyId]/vendors GET:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error'
      },
      { status: 500 }
    )
  }
}

