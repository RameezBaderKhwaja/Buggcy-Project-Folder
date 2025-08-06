import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { changePasswordSchema } from '@/lib/validators'
import { logSecurityEvent } from '@/lib/security'
import CSRFProtection from '@/lib/csrf'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = authResult.user.id

    // Validate CSRF token
    const csrfToken = request.headers.get('x-csrf-token')
    const storedToken = CSRFProtection.getCSRFTokenFromCookie(request)
    
    if (!csrfToken || !storedToken || !CSRFProtection.validateToken(csrfToken, storedToken)) {
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate with schema
    const validatedData = changePasswordSchema.parse(body)
    const { currentPassword, newPassword } = validatedData

    // Get user with current password
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

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
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

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    })

    // Log successful password change
    await logSecurityEvent({
      type: 'PASSWORD_CHANGED',
      userId,
      details: { success: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)

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