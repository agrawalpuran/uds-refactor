import { NextResponse } from 'next/server'

// Simple endpoint to check if debug API is accessible

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  return NextResponse.json({ 
    message: 'Debug API is accessible',
    timestamp: new Date().toISOString()
  })
}

