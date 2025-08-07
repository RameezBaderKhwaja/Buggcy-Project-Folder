import { NextRequest, NextResponse } from 'next/server'
import CSRFProtection from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    // Generate a new CSRF token for security protection
    const token = CSRFProtection.generateToken()
    
    // DUPLICATE CODE: Response formatting pattern
    // This response structure is repeated across multiple API routes
    const response = NextResponse.json({
      success: true,
      token
    })
    
    // Set CSRF token in HTTP-only cookie for client-side access
    return CSRFProtection.setCSRFToken(response, token)
    
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
} 