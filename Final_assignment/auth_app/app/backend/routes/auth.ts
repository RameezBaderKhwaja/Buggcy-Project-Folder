import express from "express"
import passport from "passport"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateToken, createAuthCookie, verifyToken, TokenUser } from "@/lib/auth"
import { registerSchema } from "@/lib/validators"
import {
  PasswordSecurity,
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogins,
  logSecurityEvent,
  validateEmail,
} from "@/lib/security"
import type { AuthUser } from "@/lib/types"
import {
  csrfProtection,
  generalRateLimit,
  requestLogger,
  sanitizeInputs,
  securityHeaders,
} from "../middleware/security"

export const runtime = "nodejs"


// --- TypeScript: Extend Express.User globally to match AuthUser ---
declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

const router = express.Router()

// Global security middlewares
router.use(generalRateLimit, requestLogger, sanitizeInputs, securityHeaders, csrfProtection)
router.use(generalRateLimit, requestLogger, sanitizeInputs, securityHeaders)

// Helper for async logging
const safeLogSecurityEvent = (event: Parameters<typeof logSecurityEvent>[0]) => {
  logSecurityEvent(event).catch((err: unknown) => console.error("Log error:", err))
}

// Helper for OAuth callback
async function handleOAuthCallback(
  req: express.Request & { user?: AuthUser }, 
  res: express.Response, 
  provider: string
) {
  try {
    const user = req.user
    if (!user) {
      return res.redirect(`${process.env.NEXT_PUBLIC_API_URL}/login?error=oauth_failed`)
    }
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    }
    const token = generateToken(tokenUser)
    const cookie = createAuthCookie(token)
    res.cookie(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge * 1000, // always ms
      path: cookie.path,
    })
    safeLogSecurityEvent({
      userId: user.id,
      type: "OAUTH_LOGIN_SUCCESS",
      details: { provider, email: user.email },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    })
    res.redirect(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`)
  } catch (error) {
    console.error(`${provider} callback error:`, error)
    res.redirect(`${process.env.NEXT_PUBLIC_API_URL}/login?error=oauth_failed`)
  }
}

// Register endpoint with enhanced security
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, age, gender } = req.body
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return res.status(400).json({ success: false, error: emailValidation.error })
    }
    const passwordValidation = PasswordSecurity.validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Password does not meet security requirements",
        details: passwordValidation.errors,
      })
    }
    const validatedData = registerSchema.parse({ name, email, password, age, gender })
    const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email.toLowerCase() } })
    if (existingUser) {
      safeLogSecurityEvent({
        type: "REGISTRATION_ATTEMPT_EXISTING_EMAIL",
        details: { email: validatedData.email },
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent"),
      })
      return res.status(400).json({ success: false, error: "User already exists with this email" })
    }
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        provider: "email",
        age: validatedData.age,
        gender: validatedData.gender,
      },
    })
    const tokenUser: TokenUser = { id: user.id, email: user.email, role: user.role }
    const token = generateToken(tokenUser)
    const cookie = createAuthCookie(token)
    res.cookie(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge * 1000,
      path: cookie.path,
    })
    safeLogSecurityEvent({
      userId: user.id,
      type: "USER_REGISTERED",
      details: { email: user.email, provider: "email" },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    })
    const { password: _password, ...userWithoutPassword } = user
    res.status(201).json({ success: true, data: userWithoutPassword, message: "Registration successful" })
  } catch (error: unknown) {
    next(error)
  }
})

// Enhanced login endpoint with account lockout
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" })
    }
    const lockoutStatus = await checkAccountLockout(email.toLowerCase())
    if (lockoutStatus.isLocked) {
      safeLogSecurityEvent({
        type: "LOGIN_ATTEMPT_LOCKED_ACCOUNT",
        details: {
          email,
          lockoutEnd: lockoutStatus.lockoutEnd?.toISOString(),
        },
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent"),
      })
      return res.status(423).json({
        success: false,
        error: `Account is locked. Try again after ${lockoutStatus.lockoutEnd?.toISOString()}`,
        lockoutEnd: lockoutStatus.lockoutEnd?.toISOString(),
      })
    }
    passport.authenticate("local", async (err: Error | null, user: AuthUser | false, info?: { message?: string }) => {
      if (err) {
        return next(err)
      }
      if (!user) {
        await recordFailedLogin(email.toLowerCase())
        safeLogSecurityEvent({
          type: "LOGIN_FAILED",
          details: {
            email,
            reason: info?.message || "Invalid credentials",
            attemptsRemaining: lockoutStatus.attemptsRemaining,
          },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent"),
        })
        return res.status(401).json({
          success: false,
          error: info?.message || "Invalid credentials",
          attemptsRemaining: lockoutStatus.attemptsRemaining,
        })
      }
      try {
        await clearFailedLogins(user.id)
        const tokenUser: TokenUser = { id: user.id, email: user.email, role: user.role }
        const token = generateToken(tokenUser)
        const cookie = createAuthCookie(token)
        res.cookie(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          maxAge: cookie.maxAge * 1000,
          path: cookie.path,
        })
        safeLogSecurityEvent({
          userId: user.id,
          type: "LOGIN_SUCCESS",
          details: { email: user.email },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent"),
        })
        res.json({ success: true, data: user, message: "Login successful" })
      } catch (error) {
        next(error)
      }
    })(req, res, next)
  } catch (error: unknown) {
    next(error)
  }
})

// Enhanced logout endpoint
router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies["auth-token"]
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        safeLogSecurityEvent({
          userId: payload.userId,
          type: "USER_LOGOUT",
          details: {},
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent"),
        })
      }
    }
    res.clearCookie("auth-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })
    res.json({ success: true, message: "Logged out successfully" })
  } catch (error: unknown) {
    next(error)
  }
})

// Get current user endpoint (unchanged but with logging)
router.get("/me", async (req, res, next) => {
  try {
    const token = req.cookies["auth-token"]
    if (!token) {
      return res.status(401).json({ success: false, error: "No token provided" })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({ success: false, error: "Invalid token" })
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
        updatedAt: true,
      },
    })
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }
    res.json({ success: true, data: user })
  } catch (error: unknown) {
    next(error)
  }
})

// OAuth routes with DRY callback handler
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
)
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => handleOAuthCallback(req, res, "google"),
)
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
)
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => handleOAuthCallback(req, res, "github"),
)

// Centralized error handler
router.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Auth route error:", err)
  res.status(500).json({ success: false, error: "Internal server error" })
})

export default router
