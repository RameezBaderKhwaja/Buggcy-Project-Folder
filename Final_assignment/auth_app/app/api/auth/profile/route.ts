import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { profileUpdateSchema } from '@/lib/validators'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'
import { logSecurityEvent } from '@/lib/security'
import CSRFProtection from '@/lib/csrf'

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

    // Parse form data from multipart request
    const formData = await request.formData()
    const name = formData.get('name') as string
    const age = formData.get('age') as string
    const gender = formData.get('gender') as string
    const imageFile = formData.get('image') as File | null

    // DUPLICATE CODE: Form data validation and preparation pattern
    // This validation logic could be extracted to a utility function
    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (age) {
      const ageNum = Number(age)
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        return NextResponse.json(
          { success: false, error: 'Invalid age' },
          { status: 400 }
        )
      }
      updateData.age = ageNum
    }
    if (gender) updateData.gender = gender

    // DUPLICATE CODE: Image upload and processing pattern
    // This image handling logic could be extracted to a utility function
    if (imageFile) {
      try {
        // Validate file size and type
        if (imageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'Image file size must be less than 5MB' },
            { status: 400 }
          )
        }

        if (!imageFile.type.startsWith('image/')) {
          return NextResponse.json(
            { success: false, error: 'Please select a valid image file' },
            { status: 400 }
          )
        }

        // Get current user to check for existing image
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { image: true }
        })

        // Upload new image to cloudinary with transformations
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const uploadResult = await uploadToCloudinary(buffer, {
          folder: 'profile-images',
          transformation: {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
            format: 'webp',
          }
        })

        updateData.image = uploadResult.secure_url

        // Delete old image if it exists to save storage
        if (currentUser?.image) {
          try {
            const publicId = currentUser.image.split('/').pop()?.split('.')[0]
            if (publicId) {
              await deleteFromCloudinary(publicId)
            }
          } catch (deleteError) {
            console.error('Failed to delete old image:', deleteError)
            // Don't fail the request if old image deletion fails
          }
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError)
        return NextResponse.json(
          { success: false, error: 'Failed to upload image' },
          { status: 500 }
        )
      }
    }

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No update data provided' },
        { status: 400 }
      )
    }

    // DUPLICATE CODE: Schema validation pattern
    // This validation pattern is repeated in multiple routes
    const validatedData = profileUpdateSchema.parse(updateData)

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        age: true,
        gender: true,
        provider: true,
        providerId: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // DUPLICATE CODE: Security event logging pattern
    // This logging pattern is repeated in multiple routes
    await logSecurityEvent({
      type: 'PROFILE_UPDATED',
      userId,
      details: { updatedFields: Object.keys(updateData) }
    })

    // DUPLICATE CODE: Response formatting pattern
    // This response structure is repeated across multiple API routes
    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update error:', error)

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

export async function GET(request: NextRequest) {
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

    // DUPLICATE CODE: User lookup pattern
    // This user lookup logic is repeated in multiple auth routes
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        age: true,
        gender: true,
        provider: true,
        providerId: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // DUPLICATE CODE: Response formatting pattern
    // This response structure is repeated across multiple API routes
    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 