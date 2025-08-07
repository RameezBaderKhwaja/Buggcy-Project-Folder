import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePassword, generateToken, createAuthCookie } from "@/lib/auth"
import { loginSchema } from "@/lib/validators"
import { ZodError } from "zod"

export const runtime = "nodejs"

// TODO: Add rate limiter middleware here for brute-force protection
// TODO: Add CSRF protection if needed

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body using schema
    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    const { email, password } = validatedData

    // DUPLICATE CODE: User lookup pattern
    // This user lookup logic is repeated in multiple auth routes
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // DUPLICATE CODE: Password verification pattern
    // This password verification logic is repeated in multiple auth routes
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // DUPLICATE CODE: Token generation pattern
    // This token generation logic is repeated in multiple auth routes
    const token = generateToken({ id: user.id, email: user.email, role: user.role })
    const cookie = createAuthCookie(token)

    // DUPLICATE CODE: Response formatting pattern
    // This response structure is repeated across multiple API routes
    const response = NextResponse.json({
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
      message: "Login successful",
    })

    // Set authentication cookie using headers for Node.js runtime compatibility
    response.headers.append(
      "Set-Cookie",
      `${cookie.name}=${cookie.value}; Path=${cookie.path}; HttpOnly; SameSite=${cookie.sameSite}; Max-Age=${cookie.maxAge};${cookie.secure ? " Secure;" : ""}`
    )

    return response
  } catch (error: unknown) {
    console.error("Login error:", error)

    // DUPLICATE CODE: Error handling pattern for validation errors
    // This error handling pattern is repeated in multiple routes
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
