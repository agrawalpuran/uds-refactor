/**
 * CRITICAL DIAGNOSTIC: Test encryption key loading in Next.js runtime
 * This endpoint verifies that the encryption key is loaded correctly
 * and that encryption/decryption works as expected
 */

import { NextResponse } from 'next/server'
import { encrypt, decrypt } from '@/lib/utils/encryption'

export async function GET() {
  try {
    // Get the key (same way as encryption.ts does)
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production-32-chars!!'
    
    // Test encryption/decryption
    const testEmail = 'test@example.com'
    const encrypted = encrypt(testEmail)
    const decrypted = decrypt(encrypted)
    
    // Return diagnostic info (masked for security)
    return NextResponse.json({
      success: true,
      keyLoaded: !!process.env.ENCRYPTION_KEY,
      keyLength: ENCRYPTION_KEY.length,
      keyPrefix: ENCRYPTION_KEY.substring(0, 10) + '...',
      encryptionWorks: encrypted !== testEmail && encrypted.includes(':'),
      decryptionWorks: decrypted === testEmail,
      roundTripWorks: decrypted === testEmail,
      testEmail: testEmail,
      encryptedSample: encrypted.substring(0, 50) + '...',
      decryptedResult: decrypted,
      message: decrypted === testEmail 
        ? '✅ Encryption/decryption works correctly' 
        : '❌ Encryption/decryption failed!'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

