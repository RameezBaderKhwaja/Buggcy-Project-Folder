import express from "express"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { logSecurityEvent, generateCSRFToken, SecurityLogger, PasswordSecurity } from "@/lib/security"
import { strictRateLimit } from "../middleware/security"
import { authenticateToken, requireAdmin } from "@/lib/middleware"

const router = express.Router()

// Get CSRF token
router.get("/csrf-token", (req, res) => {
  const token = generateCSRFToken()

  res.cookie("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1 hour
  })

  res.json({
    success: true,
    data: { token },
  })
})

// Get security logs (admin only)
router.get("/logs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const skip = (page - 1) * limit

    const logs = await prisma.securityLog.findMany({
      skip,
      take: limit,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    })

    const total = await prisma.securityLog.count()

    res.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          ...log,
          details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Security logs error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// Get security statistics (Admin only)
router.get("/stats", strictRateLimit, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await SecurityLogger.getSecurityStats()

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Security stats error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch security statistics",
    })
  }
})

// Password reset request
router.post("/password-reset-request", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent",
      })
    }

    // Generate reset token
    const resetToken = generateCSRFToken()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires,
      },
    })

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      type : "PASSWORD_RESET_REQUESTED",
      details: { email },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    })

    // In a real application, you would send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`)

    res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent",
    })
  } catch (error) {
    console.error("Password reset request error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// Password reset
router.post("/password-reset", async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: "Token and password are required",
      })
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      })
    }

    // Validate password strength
    const validation = PasswordSecurity.validatePasswordStrength(password)

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Password does not meet security requirements",
        details: validation.errors,
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    })

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      type: "PASSWORD_RESET_COMPLETED",
      details: { email: user.email },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    })

    res.json({
      success: true,
      message: "Password has been reset successfully",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// Log security event
router.post("/log", strictRateLimit, authenticateToken, async (req, res) => {
  try {
    const { type, details } = req.body
    const user = (req as express.Request & { user: { id: string } }).user

    await logSecurityEvent({
<<<<<<< HEAD
      type: type,
=======
      event: type,
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      details,
    })

    res.json({
      success: true,
      message: "Security event logged",
    })
  } catch (error) {
    console.error("Security log error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to log security event",
    })
  }
})

// Get recent security events (Admin only)
router.get("/events", strictRateLimit, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const events = await SecurityLogger.getRecentEvents(limit)

    res.json({
      success: true,
      data: events,
    })
  } catch (error) {
    console.error("Security events error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch security events",
    })
  }
})

export default router
