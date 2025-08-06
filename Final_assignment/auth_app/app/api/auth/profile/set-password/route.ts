import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { logSecurityEvent } from '@/lib/security'
import CSRFProtection from '@/lib/csrf'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Schema for setting password (no current password needed for OAuth users)
const setPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
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
    const validatedData = setPasswordSchema.parse(body)
    const { newPassword } = validatedData

    // Get user details
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

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Set password for OAuth user
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Log successful password setting
    await logSecurityEvent({
      type: 'PASSWORD_SET',
      userId,
      details: { provider: user.provider, success: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now use both OAuth and password login.'
    })

  } catch (error) {
    console.error('Set password error:', error)

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