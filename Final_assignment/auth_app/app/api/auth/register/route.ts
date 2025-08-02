import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken, createAuthCookie } from "@/lib/auth"
import { registerSchema } from "@/lib/validators"
import { ZodError } from "zod"

export const runtime = "nodejs"

// TODO: Add rate-limiting/anti-bot middleware (e.g., reCAPTCHA or throttle)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)
    const { name, email, password, age, gender } = validatedData
    const normalizedEmail = email.toLowerCase()

    // Check if user already exists (case-insensitive)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
        email: normalizedEmail,
        password: hashedPassword,
        provider: "email",
        age,
        gender,
      },
    })

    // Generate token with minimal payload
    const token = generateToken({ id: user.id, email: user.email, role: user.role })
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
          image: user.image ?? null,
          age: user.age ?? null,
          gender: user.gender ?? null,
          createdAt: user.createdAt,
        },
        message: "Registration successful",
      },
      { status: 201 },
    )

    // Set cookie using headers for Node.js runtime compatibility
    response.headers.append(
      "Set-Cookie",
      `${cookie.name}=${cookie.value}; Path=${cookie.path}; HttpOnly; SameSite=${cookie.sameSite}; Max-Age=${cookie.maxAge};${cookie.secure ? " Secure;" : ""}`
    )

    return response
  } catch (error: unknown) {
    console.error("Registration error:", error)

    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
