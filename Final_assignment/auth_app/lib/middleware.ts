import { type NextRequest, NextResponse } from "next/server"
import type { Request, Response, NextFunction } from "express"
import { verifyToken } from "./auth"
import { prisma } from "./prisma"
import type { AuthUser } from "./types"

export const runtime = "nodejs"

// DUPLICATE CODE: Next.js authentication middleware pattern
// This pattern duplicates the logic in verifyAuth function from lib/auth.ts
export async function withAuth(request: NextRequest, handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  try {
    // DUPLICATE CODE: Token extraction pattern
    // This token extraction logic is repeated in multiple auth routes
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized - No token provided" }, { status: 401 })
    }

    // DUPLICATE CODE: Token verification pattern
    // This verification logic is repeated in multiple auth routes
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized - Invalid token" }, { status: 401 })
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
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return handler(request, user as AuthUser)
  } catch (error: unknown) {
    console.error("Auth middleware error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// DUPLICATE CODE: Admin role verification pattern
// This admin role check is repeated in multiple API routes
export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>,
) {
  return withAuth(request, async (req, user) => {
    try {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Forbidden - Admin access required" }, { status: 403 })
      }
      return handler(req, user)
    } catch (error: unknown) {
      console.error("Admin auth error:", error)
      return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
  })
}

// Express middleware versions - DUPLICATE CODE: Express authentication pattern
// These Express middlewares duplicate the Next.js authentication logic
interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

// DUPLICATE CODE: Express token authentication pattern
// This duplicates the Next.js authentication logic for Express
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // DUPLICATE CODE: Token extraction pattern
    const token = req.cookies["auth-token"]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - No token provided",
      })
    }

    // DUPLICATE CODE: Token verification pattern
    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Invalid token",
      })
    }

    // DUPLICATE CODE: User object creation pattern
    // This creates a minimal user object instead of fetching from database
    req.user = {
      id: payload.userId,
      email: payload.email,
      name: null,
      role: payload.role,
      image: null,
      age: null,
      gender: null,
      provider: "",
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    next()
  } catch (error: unknown) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
}

// DUPLICATE CODE: Express admin role verification pattern
// This duplicates the admin role check logic
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Forbidden - Admin access required",
      })
    }
    next()
  } catch (error: unknown) {
    console.error("Admin middleware error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
}

// DUPLICATE CODE: Express full authentication pattern
// This duplicates the Next.js withAuth function for Express
export async function expressWithAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // DUPLICATE CODE: Token extraction pattern
    const token = req.cookies["auth-token"]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - No token provided",
      })
    }

    // DUPLICATE CODE: Token verification pattern
    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Invalid token",
      })
    }

    // DUPLICATE CODE: User lookup pattern
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
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      })
    }

    req.user = user as AuthUser
    next()
  } catch (error: unknown) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
}

// DUPLICATE CODE: Express admin authentication pattern
// This duplicates the Next.js withAdminAuth function for Express
export async function expressWithAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  expressWithAuth(req, res, async () => {
    try {
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          error: "Forbidden - Admin access required",
        })
      }

      next()
    } catch (error: unknown) {
      console.error("Admin auth middleware error:", error)
      res.status(500).json({
        success: false,
        error: "Internal server error",
      })
    }
  })
}