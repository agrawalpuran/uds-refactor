import { NextResponse } from 'next/server'
import { syncAllPendingShipments } from '@/lib/db/shipment-execution'
// Ensure models are registered
import '@/lib/models/Shipment'

/**
 * POST /api/shipments/sync
 * Sync all pending API shipments (background job endpoint)
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function POST() {
  try {
    const result = await syncAllPendingShipments()
    
    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: `Synced ${result.synced} shipment(s), ${result.errors} error(s)`,
    })
  } catch (error: any) {
    console.error('API Error in /api/shipments/sync POST:', error)
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

