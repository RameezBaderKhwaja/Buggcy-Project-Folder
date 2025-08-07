import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { logSecurityEvent } from '@/lib/security'
import CSRFProtection from '@/lib/csrf'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// DUPLICATE CODE: Password validation schema pattern
// This schema validation pattern is repeated in multiple password-related routes
const setPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    // DUPLICATE CODE: Authentication verification pattern
    // This pattern is repeated in multiple API routes - consider creating a middleware
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = authResult.user.id

    // DUPLICATE CODE: CSRF token validation pattern
    // This CSRF validation logic is repeated in multiple protected routes
    const csrfToken = request.headers.get('x-csrf-token')
    const storedToken = CSRFProtection.getCSRFTokenFromCookie(request)
    
    if (!csrfToken || !storedToken || !CSRFProtection.validateToken(csrfToken, storedToken)) {
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      )
    }

    // Parse and validate request body using schema
    const body = await request.json()
    const validatedData = setPasswordSchema.parse(body)
    const { newPassword } = validatedData

    // DUPLICATE CODE: User lookup pattern with password field
    // This user lookup logic is repeated in password-related routes
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        provider: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is OAuth user without password
    const isOAuthUser = user.provider !== 'local' && user.provider !== 'email'
    
    if (!isOAuthUser) {
      return NextResponse.json(
        { success: false, error: 'Password setting is only available for OAuth accounts' },
        { status: 400 }
      )
    }

    // Check if user already has a password
    if (user.password) {
      return NextResponse.json(
        { success: false, error: 'Password already set. Use change password instead.' },
        { status: 400 }
      )
    }

    // DUPLICATE CODE: Password hashing pattern
    // This password hashing logic is repeated in multiple auth routes
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Set password for OAuth user in database
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // DUPLICATE CODE: Security event logging pattern
    // This logging pattern is repeated in multiple routes
    await logSecurityEvent({
      type: 'PASSWORD_SET',
      userId,
      details: { provider: user.provider, success: true }
    })

    // DUPLICATE CODE: Response formatting pattern
    // This response structure is repeated across multiple API routes
    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now use both OAuth and password login.'
    })

  } catch (error) {
    console.error('Set password error:', error)

    // DUPLICATE CODE: Error handling pattern for validation errors
    // This error handling pattern is repeated in multiple routes
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      }, { status: 400 })
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}