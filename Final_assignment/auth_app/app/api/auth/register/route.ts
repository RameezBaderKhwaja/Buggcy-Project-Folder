import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken, createAuthCookie } from "@/lib/auth"
import { registerSchema } from "@/lib/validators"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)
    const { name, email, password, age, gender } = validatedData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ success: false, error: "User already exists with this email" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        provider: "email",
        age,
        gender,
      },
    })

    // Generate token
    const token = generateToken(user)
    const cookie = createAuthCookie(token)

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          age: user.age,
          gender: user.gender,
          createdAt: user.createdAt,
        },
        message: "Registration successful",
      },
      { status: 201 },
    )

    // Set cookie
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge,
      path: cookie.path,
    })

    return response
  } catch (error: unknown) {
    console.error("Registration error:", error)

    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
