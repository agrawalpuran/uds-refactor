import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import ShipmentServiceProvider from '@/lib/models/ShipmentServiceProvider'
import { getProviderInstance } from '@/lib/providers/ProviderFactory'

/**
 * POST /api/shipment/serviceability
 * Check serviceability for a provider by providerCode
 * 
 * Body:
 * - providerCode (required): Provider code (e.g., "SHIPROCKET")
 * - fromPincode (required): Source pincode
 * - pincode (required): Destination pincode
 * - weight (optional): Weight in kg (default: 1.0)
 * - codAmount (optional): COD amount (default: 0)
 * - courierCode (optional): Specific courier code to check
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { providerCode, fromPincode, pincode, weight, codAmount, courierCode } = body

    if (!providerCode) {
      return NextResponse.json(
        { error: 'providerCode is required' },
        { status: 400 }
      )
    }

    if (!fromPincode || !pincode) {
      return NextResponse.json(
        { error: 'fromPincode and pincode are required' },
        { status: 400 }
      )
    }

    // Validate pincode format
    const destinationPincode = String(pincode).trim()
    const sourcePincode = String(fromPincode).trim()
    
    if (!/^\d{6}$/.test(destinationPincode)) {
      return NextResponse.json(
        { error: 'Destination pincode must be a valid 6-digit number' },
        { status: 400 }
      )
    }
    if (!/^\d{6}$/.test(sourcePincode)) {
      return NextResponse.json(
        { error: 'Source pincode must be a valid 6-digit number' },
        { status: 400 }
      )
    }
    
    if (sourcePincode === destinationPincode) {
      return NextResponse.json(
        { error: 'Source and destination pincodes must be different' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get provider by code
    const provider = await ShipmentServiceProvider.findOne({ 
      providerCode: providerCode.toUpperCase() 
    }).lean()

    if (!provider) {
      return NextResponse.json(
        { error: `Provider not found: ${providerCode}` },
        { status: 404 }
      )
    }

    if (!provider.isActive) {
      return NextResponse.json(
        { error: `Provider is not active: ${providerCode}` },
        { status: 400 }
      )
    }

    // Get provider instance
    let providerInstance
    try {
      console.log(`[serviceability] Initializing provider: ${provider.providerCode}`)
      providerInstance = await getProviderInstance(provider.providerCode, undefined)
      console.log(`[serviceability] ✅ Provider instance created: ${providerInstance.providerCode}`)
    } catch (error: any) {
      console.error(`[serviceability] ❌ Failed to initialize provider:`, error)
      return NextResponse.json(
        { 
          error: `Failed to initialize provider: ${error.message}`,
          providerCode: provider.providerCode,
        },
        { status: 500 }
      )
    }

    // Check serviceability
    const shipmentWeight = weight || 1.0
    const cod = codAmount || 0

    console.log(`[serviceability] Checking serviceability from ${sourcePincode} to ${destinationPincode}`)
    
    const result = await providerInstance.checkServiceability(
      destinationPincode,
      sourcePincode,
      shipmentWeight,
      cod,
      courierCode
    )

    const serviceable = result.serviceable === true || (result as any).success === true

    return NextResponse.json({
      success: true,
      serviceable,
      message: result.message || (serviceable ? 'Serviceable' : 'Not serviceable'),
      cost: result.cost || result.rate || undefined,
      estimatedDays: result.estimatedDays || result.estimated_days,
      providerCode: provider.providerCode,
      providerName: provider.providerName,
    }, { status: 200 })
  } catch (error: any) {
    console.error('[serviceability API] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

