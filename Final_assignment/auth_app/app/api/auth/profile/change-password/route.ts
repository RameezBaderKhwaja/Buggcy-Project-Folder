import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { changePasswordSchema } from '@/lib/validators'
import { logSecurityEvent } from '@/lib/security'
import CSRFProtection from '@/lib/csrf'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
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
    const validatedData = changePasswordSchema.parse(body)
    const { currentPassword, newPassword } = validatedData

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

    // Check if user has a password set (can be local user or OAuth user with password)
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'No password set. Please use "Set Password" option first.' },
        { status: 400 }
      )
    }

    // DUPLICATE CODE: Password verification pattern
    // This password verification logic is repeated in multiple auth routes
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      // DUPLICATE CODE: Security event logging pattern
      // This logging pattern is repeated in multiple routes
      await logSecurityEvent({
        type: 'PASSWORD_CHANGE_FAILED',
        userId,
        details: { reason: 'Invalid current password' }
      })

      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // DUPLICATE CODE: Password hashing pattern
    // This password hashing logic is repeated in multiple auth routes
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update user password in database
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    })

    // DUPLICATE CODE: Security event logging pattern
    // This logging pattern is repeated in multiple routes
    await logSecurityEvent({
      type: 'PASSWORD_CHANGED',
      userId,
      details: { success: true }
    })

    // DUPLICATE CODE: Response formatting pattern
    // This response structure is repeated across multiple API routes
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)

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