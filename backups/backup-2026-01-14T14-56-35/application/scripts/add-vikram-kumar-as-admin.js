/**
 * Script to add vikram.kumar10@icicibank.com as a company admin for ICICI Bank
 * 
 * Usage: node scripts/add-vikram-kumar-as-admin.js
 */

const { MongoClient } = require('mongodb')
const crypto = require('crypto')

// Read from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uniform-distribution'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production-32-chars!!'

// Get encryption key - same logic as lib/utils/encryption.ts
function getKey() {
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8')
  // If key is not 32 bytes, hash it to get 32 bytes (same as utility)
  if (key.length !== 32) {
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
  }
  return key
}

function encrypt(text) {
  if (!text) return ''
  const iv = crypto.randomBytes(16)
  const key = getKey()
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return iv.toString('base64') + ':' + encrypted
}

function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return ''
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) return ''
    
    const key = getKey()
    let iv, encrypted
    try {
      iv = Buffer.from(parts[0], 'base64')
      encrypted = parts[1]
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
      let decrypted = decipher.update(encrypted, 'base64', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch {
      // Try hex encoding for legacy data
      iv = Buffer.from(parts[0], 'hex')
      encrypted = parts[1]
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    }
  } catch (error) {
    return ''
  }
}

async function addVikramAsAdmin() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    console.log('Connecting to MongoDB...')
    await client.connect()
    const db = client.db()
    console.log('✅ Connected to MongoDB')

    // Step 1: Find ICICI Bank company
    console.log('\n🔍 Step 1: Finding ICICI Bank company...')
    
    // First, list all companies to see what's available
    const allCompanies = await db.collection('companies').find({}).toArray()
    console.log('Available companies:')
    allCompanies.forEach(c => {
      console.log(`  - ${c.name} (id: ${c.id}, _id: ${c._id})`)
    })
    
    // Try to find ICICI Bank - search for "ICICI" in name
    let iciciBank = await db.collection('companies').findOne({
      name: { $regex: /^icici/i }
    })
    
    // If not found, try searching for "bank" in name
    if (!iciciBank) {
      iciciBank = await db.collection('companies').findOne({
        name: { $regex: /icici.*bank|bank.*icici/i }
      })
    }
    
    // If still not found, try common IDs
    if (!iciciBank) {
      iciciBank = await db.collection('companies').findOne({
        $or: [
          { id: '100004' },
          { id: '100001' }
        ]
      })
    }

    if (!iciciBank) {
      throw new Error('ICICI Bank company not found. Please check the company name or ID from the list above.')
    }

    console.log(`✅ Found ICICI Bank: ${iciciBank.name} (id: ${iciciBank.id}, _id: ${iciciBank._id})`)

    // Step 2: Find employee vikram.kumar10@icicibank.com
    console.log('\n🔍 Step 2: Finding employee vikram.kumar10@icicibank.com...')
    const normalizedEmail = 'vikram.kumar10@icicibank.com'.trim().toLowerCase()
    
    // Try encrypted email lookup
    const encryptedEmail = encrypt(normalizedEmail)
    let employee = await db.collection('employees').findOne({
      email: encryptedEmail
    })

    // If not found, try plain text email
    if (!employee) {
      employee = await db.collection('employees').findOne({
        email: normalizedEmail
      })
    }

    // If still not found, try case-insensitive regex
    if (!employee) {
      employee = await db.collection('employees').findOne({
        email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      })
    }

    // If still not found, try decryption matching
    if (!employee) {
      const allEmployees = await db.collection('employees').find({ companyId: iciciBank._id }).toArray()
      console.log(`Checking ${allEmployees.length} employees via decryption...`)
      
      for (const emp of allEmployees) {
        if (emp.email && typeof emp.email === 'string') {
          try {
            const decryptedEmail = decrypt(emp.email)
            if (decryptedEmail && decryptedEmail.trim().toLowerCase() === normalizedEmail) {
              employee = emp
              console.log(`✅ Found employee via decryption: ${decryptedEmail}`)
              break
            }
          } catch (error) {
            continue
          }
        }
      }
    }

    if (!employee) {
      // Employee doesn't exist - create it
      console.log(`\n📝 Employee not found. Creating new employee: vikram.kumar10@icicibank.com...`)
      
      // Get next employee ID
      const lastEmployee = await db.collection('employees').find({})
        .sort({ id: -1 })
        .limit(1)
        .toArray()
      
      let nextId = 300042 // Start from 300042
      if (lastEmployee.length > 0 && lastEmployee[0].id) {
        const lastId = parseInt(String(lastEmployee[0].id), 10)
        if (!isNaN(lastId) && lastId >= 300000) {
          nextId = lastId + 1
        }
      }
      
      // Find Mumbai location for ICICI Bank
      const mumbaiLocation = await db.collection('locations').findOne({
        companyId: iciciBank._id,
        $or: [
          { name: { $regex: /mumbai/i } },
          { city: { $regex: /mumbai/i } }
        ]
      })
      
      // Create employee document
      const employeeDoc = {
        id: String(nextId),
        employeeId: String(nextId),
        firstName: encrypt('Vikram'),
        lastName: encrypt('Kumar'),
        designation: encrypt('Company Administrator'),
        gender: 'male',
        location: 'Mumbai',
        email: encryptedEmail,
        mobile: encrypt('+91-9876543210'),
        shirtSize: 'L',
        pantSize: '32',
        shoeSize: '9',
        address: encrypt('D-456, Bandra Kurla Complex, Mumbai, Maharashtra 400051'),
        companyId: iciciBank._id,
        companyName: iciciBank.name,
        locationId: mumbaiLocation ? mumbaiLocation._id : null,
        eligibility: {
          shirt: 6,
          pant: 4,
          shoe: 2,
          jacket: 2
        },
        cycleDuration: {
          shirt: 6,
          pant: 6,
          shoe: 6,
          jacket: 12
        },
        dispatchPreference: 'direct',
        status: 'active',
        period: '2024-2025',
        dateOfJoining: new Date('2025-10-01T00:00:00.000Z'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await db.collection('employees').insertOne(employeeDoc)
      employee = employeeDoc
      employee._id = result.insertedId
      
      console.log(`✅ Employee created!`)
      console.log(`   ID: ${nextId}`)
      console.log(`   Name: Vikram Kumar`)
      console.log(`   Email: ${normalizedEmail}`)
    }

    console.log(`✅ Found employee: ${employee.id || employee.employeeId} (_id: ${employee._id})`)

    // Step 3: Check if already an admin
    console.log('\n🔍 Step 3: Checking if already an admin...')
    const existingAdmin = await db.collection('companyadmins').findOne({
      companyId: iciciBank._id,
      employeeId: employee._id
    })

    if (existingAdmin) {
      console.log('⚠️ Employee is already a company admin!')
      console.log('Admin record:', {
        _id: existingAdmin._id,
        companyId: existingAdmin.companyId?.toString(),
        employeeId: existingAdmin.employeeId?.toString(),
        canApproveOrders: existingAdmin.canApproveOrders
      })
      console.log('\n✅ Script completed - employee is already an admin')
      await mongoose.connection.close()
      return
    }

    // Step 4: Add as company admin
    console.log('\n➕ Step 4: Adding employee as company admin...')
    
    // Ensure ObjectIds are used (not strings)
    const { ObjectId } = require('mongodb')
    const companyIdObjectId = iciciBank._id instanceof ObjectId 
      ? iciciBank._id 
      : new ObjectId(iciciBank._id)
    const employeeIdObjectId = employee._id instanceof ObjectId
      ? employee._id
      : new ObjectId(employee._id)
    
    console.log(`   Using companyId: ${companyIdObjectId} (ObjectId)`)
    console.log(`   Using employeeId: ${employeeIdObjectId} (ObjectId)`)
    
    const adminRecord = await db.collection('companyadmins').insertOne({
      companyId: companyIdObjectId,
      employeeId: employeeIdObjectId,
      canApproveOrders: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    if (!adminRecord.insertedId) {
      throw new Error('Failed to create admin record')
    }

    console.log('✅ Admin record created:', {
      adminId: adminRecord.insertedId,
      companyId: iciciBank._id.toString(),
      employeeId: employee._id.toString(),
      canApproveOrders: true
    })

    // Step 5: Verify the record
    console.log('\n🔍 Step 5: Verifying admin record...')
    const verifyRecord = await db.collection('companyadmins').findOne({
      _id: adminRecord.insertedId
    })

    if (!verifyRecord) {
      throw new Error('Admin record was created but cannot be found')
    }

    console.log('✅ Admin record verified:', {
      _id: verifyRecord._id.toString(),
      companyId: verifyRecord.companyId?.toString(),
      employeeId: verifyRecord.employeeId?.toString(),
      canApproveOrders: verifyRecord.canApproveOrders
    })

    console.log('\n✅ SUCCESS: vikram.kumar10@icicibank.com has been added as a company admin for ICICI Bank!')
    console.log('\nThe employee can now log in to the company admin portal.')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error.stack)
    await client.close()
    process.exit(1)
  } finally {
    await client.close()
    console.log('\nDatabase connection closed')
  }
}

// Run the script
addVikramAsAdmin()

