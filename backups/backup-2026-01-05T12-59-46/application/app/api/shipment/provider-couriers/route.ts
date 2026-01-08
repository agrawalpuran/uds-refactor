import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import ShipmentServiceProvider from '@/lib/models/ShipmentServiceProvider'
import { getProviderInstance } from '@/lib/providers/ProviderFactory'

/**
 * GET /api/shipment/provider-couriers
 * Get supported couriers for a provider by providerCode
 * 
 * Query parameters:
 * - providerCode (required): Provider code (e.g., "SHIPROCKET")
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const providerCode = searchParams.get('providerCode')

    if (!providerCode) {
      return NextResponse.json(
        { error: 'providerCode is required' },
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
      console.log(`[provider-couriers] Initializing provider: ${provider.providerCode}`)
      providerInstance = await getProviderInstance(provider.providerCode, undefined)
      console.log(`[provider-couriers] ✅ Provider instance created: ${providerInstance.providerCode}`)
    } catch (error: any) {
      console.error(`[provider-couriers] ❌ Failed to initialize provider:`, error)
      return NextResponse.json(
        { 
          error: `Failed to initialize provider: ${error.message}`,
          providerCode: provider.providerCode,
        },
        { status: 500 }
      )
    }

    // Get supported couriers
    if (!providerInstance.getSupportedCouriers) {
      return NextResponse.json(
        { error: 'Courier listing not supported by this provider' },
        { status: 400 }
      )
    }

    const result = await providerInstance.getSupportedCouriers()
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to fetch couriers',
          providerCode: provider.providerCode,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      providerCode: provider.providerCode,
      providerName: provider.providerName,
      couriers: result.couriers || [],
    }, { status: 200 })
  } catch (error: any) {
    console.error('[provider-couriers API] Error:', error)
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

