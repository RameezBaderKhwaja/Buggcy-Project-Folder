import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    // DUPLICATE CODE: Token extraction pattern
    // This token extraction logic is repeated in multiple auth routes
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    // DUPLICATE CODE: Token verification pattern
    // This verification logic is repeated in multiple auth routes
    let payload
    try {
      payload = verifyToken(token)
    } catch (err) {
      return NextResponse.json({ success: false, error: "Malformed or corrupted token" }, { status: 401 })
    }

    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    // DUPLICATE CODE: User lookup pattern
    // This user lookup logic is repeated in multiple auth routes
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // DUPLICATE CODE: Response formatting pattern
    // This response structure is repeated across multiple API routes
    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error: unknown) {
    console.error("Auth check error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
