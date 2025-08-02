import express from "express"
import bcrypt from "bcryptjs"
import type { Request, Response, NextFunction } from "express"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { logSecurityEvent, generateCSRFToken, SecurityLogger, PasswordSecurity } from "@/lib/security"
import { strictRateLimit, sanitizeInputs } from "../middleware/security"
import { authenticateToken, requireAdmin } from "@/lib/middleware"
import { z } from "zod"

const router = express.Router()

// Helper: generate a strong reset token (not CSRF)
function generateResetToken() {
  return require("crypto").randomBytes(32).toString("hex")
}

// Apply sanitizeInputs to all POST routes
router.use(sanitizeInputs)

// Get CSRF token (comment: store/verify in session/redis in production)
router.get("/csrf-token", (req, res) => {
  const token = generateCSRFToken()
  res.cookie("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1 hour
  })
  res.setHeader("Cache-Control", "no-store")
  res.json({ success: true, data: { token } })
})

// Get security logs (admin only, strictRateLimit, max limit)
router.get("/logs", strictRateLimit, authenticateToken, requireAdmin, async (req, res, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const skip = (page - 1) * limit
    const logs = await prisma.securityLog.findMany({
      skip,
      take: limit,
      orderBy: { timestamp: "desc" },
      include: { user: { select: { email: true, name: true } } },
    })
    const total = await prisma.securityLog.count()
    res.setHeader("Cache-Control", "no-store")
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
  } catch (error: unknown) {
    next(error)
  }
})

// Get security statistics (Admin only)
router.get("/stats", strictRateLimit, authenticateToken, requireAdmin, async (req, res, next: NextFunction) => {
  try {
    const stats = await SecurityLogger.getSecurityStats()
    res.setHeader("Cache-Control", "no-store")
    res.json({ success: true, data: stats })
  } catch (error: unknown) {
    next(error)
  }
})

// Password reset request
const passwordResetRequestSchema = z.object({ email: z.string().email() })
router.post("/password-reset-request", async (req, res, next: NextFunction) => {
  try {
    const { email } = passwordResetRequestSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: "If an account with that email exists, a password reset link has been sent" })
    }
    // Generate reset token (not CSRF)
    const resetToken = generateResetToken()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000)
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetExpires } })
    logSecurityEvent({
      userId: user.id,
      type : "PASSWORD_RESET_REQUESTED",
      details: { email },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    }).catch(console.error)
    // In a real application, you would send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`)
    res.setHeader("Cache-Control", "no-store")
    res.json({ success: true, message: "If an account with that email exists, a password reset link has been sent" })
  } catch (error: unknown) {
    next(error)
  }
})

// Password reset
const passwordResetSchema = z.object({ token: z.string(), password: z.string().min(8) })
router.post("/password-reset", async (req, res, next: NextFunction) => {
  try {
    const { token, password } = passwordResetSchema.parse(req.body)
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetExpires: { gt: new Date() } },
    })
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or expired reset token" })
    }
    const validation = PasswordSecurity.validatePasswordStrength(password)
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: "Password does not meet security requirements", details: validation.errors })
    }
    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        // TODO: Increment tokenVersion or similar to revoke old JWTs
      },
    })
    logSecurityEvent({
      userId: user.id,
      type: "PASSWORD_RESET_COMPLETED",
      details: { email: user.email },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    }).catch(console.error)
    res.setHeader("Cache-Control", "no-store")
    res.json({ success: true, message: "Password has been reset successfully" })
  } catch (error: unknown) {
    next(error)
  }
})

// Log security event
const logEventSchema = z.object({ type: z.string(), details: z.any() })
router.post("/log", strictRateLimit, authenticateToken, async (req, res, next: NextFunction) => {
  try {
    const { type, details } = logEventSchema.parse(req.body)
    const user = req.user as { id: string } | undefined
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: "Unauthorized" })
    }
    logSecurityEvent({
      type,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      details,
    }).catch(console.error)
    res.json({ success: true, message: "Security event logged" })
  } catch (error: unknown) {
    next(error)
  }
})

// Get recent security events (Admin only)
router.get("/events", strictRateLimit, authenticateToken, requireAdmin, async (req, res, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const events = await SecurityLogger.getRecentEvents(limit)
    res.setHeader("Cache-Control", "no-store")
    res.json({ success: true, data: events })
  } catch (error: unknown) {
    next(error)
  }
})

// Centralized error handler
router.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Security route error:", err)
  res.status(500).json({ success: false, error: "Internal server error" })
})

export default router
