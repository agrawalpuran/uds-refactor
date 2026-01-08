import { NextResponse } from 'next/server'
import { getAllVendors, getVendorById, getVendorByEmail, createVendor, updateVendor } from '@/lib/db/data-access'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const email = searchParams.get('email')

    if (email) {
      // CRITICAL: Sanitize and validate email before querying
      const sanitizedEmail = email.trim()
      console.log(`[API /vendors] Looking up vendor by email: ${sanitizedEmail}`)
      
      try {
        const vendor = await getVendorByEmail(sanitizedEmail)
        if (!vendor) {
          console.log(`[API /vendors] Vendor not found for email: ${sanitizedEmail}`)
          return NextResponse.json({ error: 'Vendor not found with this email' }, { status: 404 })
        }
        console.log(`[API /vendors] ✅ Vendor found: ${vendor.id} (${vendor.name})`)
        return NextResponse.json(vendor)
      } catch (dbError: any) {
        // CRITICAL: Differentiate between "not found" and "database error"
        console.error(`[API /vendors] ❌ Database error during vendor lookup:`, dbError)
        
        // Check if it's a MongoDB connection error
        if (dbError.message && (
          dbError.message.includes('Password contains unescaped characters') ||
          dbError.message.includes('MongoParseError') ||
          dbError.message.includes('connection') ||
          dbError.message.includes('authentication')
        )) {
          console.error(`[API /vendors] ❌ CRITICAL: MongoDB connection/authentication error`)
          return NextResponse.json({ 
            error: 'Database connection error. Please contact system administrator.',
            details: 'MongoDB connection failed',
            code: 'DB_CONNECTION_ERROR'
          }, { status: 500 })
        }
        
        // For other errors, return generic error (don't expose vendor existence)
        return NextResponse.json({ 
          error: 'Error looking up vendor. Please try again.',
          code: 'QUERY_ERROR'
        }, { status: 500 })
      }
    }

    if (vendorId) {
      const vendor = await getVendorById(vendorId)
      return NextResponse.json(vendor)
    }

    const vendors = await getAllVendors()
    return NextResponse.json(vendors)
  } catch (error: any) {
    console.error('[API /vendors] ❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      code: 'UNEXPECTED_ERROR'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const vendor = await createVendor(body)
    return NextResponse.json(vendor)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { vendorId, ...vendorData } = body
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }
    
    const vendor = await updateVendor(vendorId, vendorData)
    return NextResponse.json(vendor)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}





