import { NextResponse } from 'next/server'
import { getProductSizeCharts } from '@/lib/db/data-access'


// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productIdsParam = searchParams.get('productIds')

    if (!productIdsParam) {
      return NextResponse.json(
        { error: 'productIds parameter is required' },
        { status: 400 }
      )

    }
    const productIds = productIdsParam.split(',').filter(id => /^\d{6}$/.test(id))

    if (productIds.length === 0) {
      return NextResponse.json({}, { status: 200 })

    }
    const sizeCharts = await getProductSizeCharts(productIds)

    return NextResponse.json(sizeCharts, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching size charts:', error)
    console.error('Error fetching size charts:', error)
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    
    // Return 400 for validation/input errors
    if (errorMessage.includes('required') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('missing') ||
        errorMessage.includes('Invalid JSON')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    
    // Return 404 for not found errors
    if (errorMessage.includes('not found') || 
        errorMessage.includes('Not found') || 
        errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    
    // Return 401 for authentication errors
    if (errorMessage.includes('Unauthorized') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('token')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    
    // Return 500 for server errors
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

