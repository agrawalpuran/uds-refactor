import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/db/mongodb'

export async function GET(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    
    if (!vendorId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })
    }
    
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }
    
    console.log(`[DEBUG API] Starting debug for vendorId: ${vendorId}`)
    
    const debugInfo: any = {
      vendorId,
      steps: []
    }
    
    // Step 1: Find vendor
    const vendor = await db.collection('vendors').findOne({ id: vendorId })
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found', debugInfo }, { status: 404 })
    }
    
    debugInfo.vendor = {
      name: vendor.name,
      id: vendor.id,
      _id: vendor._id?.toString(),
      _idType: vendor._id?.constructor?.name
    }
    
    const vendorObjectId = vendor._id instanceof mongoose.Types.ObjectId
      ? vendor._id
      : new mongoose.Types.ObjectId(vendor._id)
    
    // Step 2: Query ProductVendor with ObjectId
    const productVendorLinks1 = await db.collection('productvendors').find({ 
      vendorId: vendorObjectId 
    }).toArray()
    
    debugInfo.steps.push({
      method: 'ObjectId query',
      query: { vendorId: vendorObjectId.toString() },
      found: productVendorLinks1.length
    })
    
    // Step 3: Query ProductVendor with string
    const vendorIdString = vendorObjectId.toString()
    const productVendorLinks2 = await db.collection('productvendors').find({ 
      vendorId: vendorIdString 
    }).toArray()
    
    debugInfo.steps.push({
      method: 'String query',
      query: { vendorId: vendorIdString },
      found: productVendorLinks2.length
    })
    
    // Step 4: Get ALL ProductVendor links
    const allLinks = await db.collection('productvendors').find({}).toArray()
    debugInfo.totalProductVendorLinks = allLinks.length
    
    // Step 5: Manual filtering
    const vendorDbObjectId = vendor._id instanceof mongoose.Types.ObjectId
      ? vendor._id
      : (mongoose.Types.ObjectId.isValid(vendor._id) ? new mongoose.Types.ObjectId(vendor._id) : null)
    
    const matchedLinks = allLinks.filter((link: any) => {
      const linkVendorId = link.vendorId
      let linkVendorIdStr = ''
      let linkVendorIdObjectId: mongoose.Types.ObjectId | null = null
      
      if (linkVendorId instanceof mongoose.Types.ObjectId) {
        linkVendorIdStr = linkVendorId.toString()
        linkVendorIdObjectId = linkVendorId
      } else if (typeof linkVendorId === 'object' && linkVendorId !== null) {
        linkVendorIdStr = linkVendorId.toString ? linkVendorId.toString() : String(linkVendorId)
        if (linkVendorId._id) {
          linkVendorIdObjectId = linkVendorId._id instanceof mongoose.Types.ObjectId 
            ? linkVendorId._id 
            : (mongoose.Types.ObjectId.isValid(linkVendorId._id) ? new mongoose.Types.ObjectId(linkVendorId._id) : null)
        } else if (mongoose.Types.ObjectId.isValid(linkVendorId)) {
          linkVendorIdObjectId = new mongoose.Types.ObjectId(linkVendorId)
        }
      } else {
        linkVendorIdStr = String(linkVendorId || '')
        if (mongoose.Types.ObjectId.isValid(linkVendorIdStr)) {
          linkVendorIdObjectId = new mongoose.Types.ObjectId(linkVendorIdStr)
        }
      }
      
      const matches = 
        linkVendorIdStr === vendorObjectId.toString() ||
        (linkVendorIdObjectId && vendorObjectId && linkVendorIdObjectId.equals(vendorObjectId)) ||
        (linkVendorId === vendor._id) ||
        (linkVendorIdObjectId && vendorDbObjectId && linkVendorIdObjectId.equals(vendorDbObjectId))
      
      return matches
    })
    
    debugInfo.steps.push({
      method: 'Manual filter',
      found: matchedLinks.length
    })
    
    debugInfo.sampleLinks = allLinks.slice(0, 5).map((link: any) => ({
      vendorId: link.vendorId?.toString ? link.vendorId.toString() : String(link.vendorId || ''),
      vendorIdType: typeof link.vendorId,
      vendorIdConstructor: link.vendorId?.constructor?.name,
      productId: link.productId?.toString ? link.productId.toString() : String(link.productId || ''),
      matches: matchedLinks.some(m => m === link)
    }))
    
    // Step 6: Extract product IDs and query products
    let products: any[] = []
    if (matchedLinks.length > 0) {
      const productIds = matchedLinks.map((link: any) => {
        const productId = link.productId
        if (productId instanceof mongoose.Types.ObjectId) {
          return productId
        }
        if (mongoose.Types.ObjectId.isValid(productId)) {
          return new mongoose.Types.ObjectId(productId)
        }
        return null
      }).filter(id => id !== null)
      
      products = await db.collection('uniforms').find({
        _id: { $in: productIds }
      }).toArray()
      
      debugInfo.products = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        _id: p._id?.toString()
      }))
    }
    
    return NextResponse.json({
      success: true,
      vendor: debugInfo.vendor,
      productVendorLinks: {
        objectIdQuery: productVendorLinks1.length,
        stringQuery: productVendorLinks2.length,
        manualFilter: matchedLinks.length,
        totalInDatabase: allLinks.length
      },
      products: {
        count: products.length,
        items: debugInfo.products || []
      },
      debug: debugInfo
    })
  } catch (error: any) {
    console.error('[DEBUG API] Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      stack: error.stack 
    }, { status: 500 })
  }
}

