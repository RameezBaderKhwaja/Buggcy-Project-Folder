import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex')
  }

  static validateToken(token: string, storedToken: string): boolean {
    if (!token || !storedToken) return false
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(storedToken, 'hex')
    )
  }

  static async getTokenFromRequest(request: NextRequest): Promise<string | null> {
    // Check header first
    const headerToken = request.headers.get('x-csrf-token')
    if (headerToken) return headerToken

    // Check form data
    try {
      const formData = await request.formData()
      const token = formData.get('csrfToken')
      if (typeof token === 'string') return token
    } catch {
      // Ignore form data parsing errors
    }

    // Check JSON body
    try {
      const body = await request.json()
      if (body && typeof body === 'object' && 'csrfToken' in body) {
        return body.csrfToken as string
      }
    } catch {
      // Ignore JSON parsing errors
    }

    return null
  }

  static setCSRFToken(response: NextResponse, token: string): NextResponse {
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.TOKEN_EXPIRY / 1000,
      path: '/'
    })
    return response
  }

  static getCSRFTokenFromCookie(request: NextRequest): string | null {
    return request.cookies.get('csrf-token')?.value || null
  }

  static createCSRFMiddleware() {
    return async function csrfMiddleware(request: NextRequest) {
      const { pathname } = request.nextUrl
      
      // Skip CSRF for GET requests and static files
      if (request.method === 'GET' || 
          pathname.startsWith('/_next/') || 
          pathname.startsWith('/api/auth/') ||
          pathname.includes('.')) {
        return NextResponse.next()
      }

      // For state-changing operations, validate CSRF token
      const providedToken = await CSRFProtection.getTokenFromRequest(request)
      const storedToken = CSRFProtection.getCSRFTokenFromCookie(request)

      if (!providedToken || !storedToken || !CSRFProtection.validateToken(providedToken, storedToken)) {
        return new NextResponse(
          JSON.stringify({ 
            success: false, 
            error: 'CSRF token validation failed' 
          }),
          { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' } 
          }
        )
      }

      return NextResponse.next()
    }
  }
}

// Helper function to generate CSRF token for forms
export function generateCSRFToken(): string {
  return CSRFProtection.generateToken()
}

// Helper function to validate CSRF token
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return CSRFProtection.validateToken(token, storedToken)
}

// Export the main class
export default CSRFProtection 