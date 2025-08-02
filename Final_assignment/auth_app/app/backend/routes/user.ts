import express from "express"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { expressWithAuth, expressWithAdminAuth } from "@/lib/middleware"
import type { AuthUser } from "@/lib/types"
import { 
  requestLogger, 
  sanitizeInputs, 
  securityHeaders, 
  generalRateLimit,
  strictRateLimit 
} from "../middleware/security"

const router = express.Router()

// Apply global middlewares to all routes
router.use(requestLogger)
router.use(sanitizeInputs)
router.use(securityHeaders)

// Validation schemas
const getUsersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
  role: z.enum(["USER", "ADMIN"]).optional(),
  search: z.string().optional(),
})

const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
})

// Enhanced error handler
const handleError = (error: unknown, res: express.Response, context: string) => {
  console.error(`${context} error:`, error)
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: "Invalid input",
      details: error.issues,
    })
  }
  
  return res.status(500).json({
    success: false,
    error: "Internal server error",
  })
}

// Get all users (admin only) with pagination and filtering
router.get("/", generalRateLimit, expressWithAdminAuth, async (req, res) => {
  try {
    const query = getUsersQuerySchema.parse(req.query)
    const { page, limit, role, search } = query
    
    const skip = (page - 1) * limit
    
    // Build where clause for filtering
    const where: any = {}
    if (role) {
      where.role = role
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where })
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalUsers / limit)

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    return handleError(error, res, "Get users")
  }
})

// Get user by ID with proper authorization
router.get("/:id", strictRateLimit, expressWithAuth, async (req, res) => {
  try {
    // Validate ID parameter
    const { id } = userIdParamSchema.parse(req.params)
    const requestingUser = req.user as AuthUser

    // Authorization check: users can only view their own profile unless they're admin
    if (requestingUser.id !== id && requestingUser.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Forbidden - You can only view your own profile",
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        age: true,
        gender: true,
        // Only include provider info for admin or own profile
        ...(requestingUser.role === "ADMIN" || requestingUser.id === id 
          ? { provider: true, providerId: true } 
          : {}),
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

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    return handleError(error, res, "Get user")
  }
})

export default router
