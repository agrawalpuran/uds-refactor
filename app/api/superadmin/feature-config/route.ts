import { NextResponse } from 'next/server'
import { getSystemFeatureConfig, updateSystemFeatureConfig } from '@/lib/db/feature-config-access'
// Ensure models are registered
import '@/lib/models/SystemFeatureConfig'

/**
 * GET /api/superadmin/feature-config
 * Get system feature configuration
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const config = await getSystemFeatureConfig()
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('API Error in /api/superadmin/feature-config GET:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/superadmin/feature-config
 * Update system feature configuration
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { testOrdersEnabled, updatedBy } = body

    if (testOrdersEnabled === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      )
    }

    const config = await updateSystemFeatureConfig(
      {
        testOrdersEnabled,
      },
      updatedBy
    )

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('API Error in /api/superadmin/feature-config PUT:', error)
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

