import { NextResponse } from 'next/server'
import { getSystemShippingConfig, updateSystemShippingConfig } from '@/lib/db/shipping-config-access'
// Ensure models are registered
import '@/lib/models/SystemShippingConfig'

/**
 * GET /api/superadmin/shipping-config
 * Get system shipping configuration
 */

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const config = await getSystemShippingConfig()
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('API Error in /api/superadmin/shipping-config GET:', error)
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
 * PUT /api/superadmin/shipping-config
 * Update system shipping configuration
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { shippingIntegrationEnabled, allowMultipleProvidersPerCompany, updatedBy } = body

    if (shippingIntegrationEnabled === undefined && allowMultipleProvidersPerCompany === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      )
    }

    const config = await updateSystemShippingConfig(
      {
        shippingIntegrationEnabled,
        allowMultipleProvidersPerCompany,
      },
      updatedBy
    )

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('API Error in /api/superadmin/shipping-config PUT:', error)
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

