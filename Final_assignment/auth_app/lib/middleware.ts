import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "./auth"
import { prisma } from "./prisma"
import { USER_ROLES } from "./constants"

export async function withAuth(request: NextRequest, handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized - No token provided" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized - Invalid token" }, { status: 401 })
    }

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
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return handler(request, user)
  } catch (error) {
    console.error("Auth middleware error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
) {
  return withAuth(request, async (req, user) => {
    if (user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden - Admin access required" }, { status: 403 })
    }
    return handler(req, user)
  })
}

// Express middleware versions
export function expressWithAuth(req: any, res: any, next: any) {
  try {
    const token = req.cookies["auth-token"]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - No token provided",
      })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Invalid token",
      })
    }

    req.user = payload
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
}

export function expressWithAdminAuth(req: any, res: any, next: any) {
  expressWithAuth(req, res, async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      })

      if (!user || user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({
          success: false,
          error: "Forbidden - Admin access required",
        })
      }

      next()
    } catch (error) {
      console.error("Admin auth middleware error:", error)
      res.status(500).json({
        success: false,
        error: "Internal server error",
      })
    }
  })
}
