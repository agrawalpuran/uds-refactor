import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Branch from '@/lib/models/Branch'
import Company from '@/lib/models/Company'
import mongoose from 'mongoose'

/**
 * GET /api/companies/[companyId]/branches
 * Get all branches for a company
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

    // Find branches for the company - try multiple query methods
    // Method 1: Direct ObjectId match (most common)
    let branches: any[] = await Branch.find({
      companyId: company._id
    }).lean()

    console.log(`[branches API] Method 1 (ObjectId): Found ${branches.length} branches for company ${company.id} (${company._id})`)

    // Method 2: Try with company string ID (if stored as string)
    if (branches.length === 0 && company.id) {
      branches = await Branch.find({
        companyId: company.id
      }).lean()
      console.log(`[branches API] Method 2 (string ID): Found ${branches.length} branches using company string ID`)
    }

    // Method 3: Try with converted ObjectId from string ID
    if (branches.length === 0 && company.id && mongoose.Types.ObjectId.isValid(company.id)) {
      try {
        const companyIdAsObjectId = new mongoose.Types.ObjectId(company.id)
        branches = await Branch.find({
          companyId: companyIdAsObjectId
        }).lean()
        console.log(`[branches API] Method 3 (converted ObjectId): Found ${branches.length} branches`)
      } catch (error) {
        console.log(`[branches API] Method 3 failed: ${error}`)
      }
    }

    // Method 4: Raw collection query with multiple formats (fallback)
    if (branches.length === 0) {
      if (!mongoose.connection.db) {
        return NextResponse.json(
          { error: 'Database connection not available' },
          { status: 500 }
        )
      }
      const db = mongoose.connection.db
      if (db) {
        const branchesCollection = db.collection('branches')
        const allBranches = await branchesCollection.find({}).toArray()
        const companyIdStr = company._id.toString()
        const companyIdNum = company.id

        console.log(`[branches API] Method 4 (raw collection): Checking ${allBranches.length} total branches in database`)

        branches = allBranches.filter((branch: any) => {
          if (!branch.companyId) {
            console.log(`[branches API] Branch ${branch.id || branch._id} has no companyId`)
            return false
          }

          const branchCompanyId = branch.companyId
          const branchCompanyIdStr = branchCompanyId?.toString() || String(branchCompanyId)

          // Match by ObjectId string
          if (branchCompanyIdStr === companyIdStr) {
            console.log(`[branches API] ✅ Matched branch ${branch.id || branch.name} by ObjectId string`)
            return true
          }

          // Match by company numeric ID
          if (companyIdNum && branchCompanyIdStr === String(companyIdNum)) {
            console.log(`[branches API] ✅ Matched branch ${branch.id || branch.name} by numeric ID`)
            return true
          }

          // Match if it's an ObjectId that matches
          if (branchCompanyId instanceof mongoose.Types.ObjectId) {
            if (branchCompanyId.toString() === companyIdStr) {
              console.log(`[branches API] ✅ Matched branch ${branch.id || branch.name} by ObjectId instance`)
              return true
            }
          }

          // Match if companyId is stored as ObjectId in different format
          if (typeof branchCompanyId === 'object' && branchCompanyId.toString) {
            if (branchCompanyId.toString() === companyIdStr) {
              console.log(`[branches API] ✅ Matched branch ${branch.id || branch.name} by object toString`)
              return true
            }
          }

          return false
        })

        console.log(`[branches API] Method 4: Found ${branches.length} branches after filtering all branches`)
      }
    }

    // Log all found branches for debugging
    if (branches.length > 0) {
      console.log(`[branches API] ✅ Successfully found ${branches.length} branch(es):`)
      branches.forEach((branch: any) => {
        console.log(`  - ${branch.name} (id: ${branch.id}, _id: ${branch._id}, companyId: ${branch.companyId}, status: ${branch.status || 'active'})`)
      })
    } else {
      console.log(`[branches API] ⚠️ No branches found for company ${company.id}. Checking all branches in database...`)
      if (!mongoose.connection.db) {
        return NextResponse.json(
          { error: 'Database connection not available' },
          { status: 500 }
        )
      }
      const db = mongoose.connection.db
      if (db) {
        const allBranches = await db.collection('branches').find({}).toArray()
        console.log(`[branches API] Total branches in database: ${allBranches.length}`)
        console.log(`[branches API] Company details: id=${company.id}, _id=${company._id}, _id.toString()=${company._id.toString()}`)
        
        allBranches.forEach((b: any) => {
          const bCompanyId = b.companyId
          const bCompanyIdStr = bCompanyId?.toString() || String(bCompanyId)
          const matches = (
            bCompanyIdStr === company._id.toString() ||
            bCompanyIdStr === String(company.id) ||
            (bCompanyId instanceof mongoose.Types.ObjectId && bCompanyId.toString() === company._id.toString())
          )
          console.log(`  - Branch: ${b.name} (id: ${b.id}, companyId: ${bCompanyIdStr}, companyId type: ${typeof bCompanyId}, matches: ${matches})`)
        })
        
        // Final attempt: try to find branches by comparing all possible formats
        const companyIdVariants = [
          company._id,
          company._id.toString(),
          company.id,
          new mongoose.Types.ObjectId(company._id),
        ].filter(Boolean)
        
        console.log(`[branches API] Trying to match with companyId variants: ${companyIdVariants.map(v => v.toString()).join(', ')}`)
        
        const matchedBranches = allBranches.filter((b: any) => {
          if (!b.companyId) return false
          const bCompanyId = b.companyId
          const bCompanyIdStr = bCompanyId?.toString() || String(bCompanyId)
          return companyIdVariants.some(variant => {
            const variantStr = variant?.toString() || String(variant)
            return bCompanyIdStr === variantStr || 
                   (bCompanyId instanceof mongoose.Types.ObjectId && bCompanyId.equals && bCompanyId.equals(variant))
          })
        })
        
        if (matchedBranches.length > 0) {
          console.log(`[branches API] ✅ Found ${matchedBranches.length} branch(es) using variant matching`)
          branches = matchedBranches
        }
      }
    }

    // Ensure we return branches with proper structure
    const formattedBranches = branches.map((branch: any) => ({
      _id: branch._id?.toString() || branch._id,
      id: branch.id,
      name: branch.name,
      city: branch.city,
      state: branch.state,
      companyId: branch.companyId?.toString() || branch.companyId,
      status: branch.status || 'active',
      ...branch // Include all other fields
    }))

    console.log(`[branches API] Returning ${formattedBranches.length} formatted branch(es)`)
    return NextResponse.json(formattedBranches)
  } catch (error: any) {
    console.error('API Error in /api/companies/[companyId]/branches GET:', error)
    return NextResponse.json(
      {
        error: error.message || 'Unknown error occurred',
        type: 'api_error'
      },
      { status: 500 }
    )
  }
}

