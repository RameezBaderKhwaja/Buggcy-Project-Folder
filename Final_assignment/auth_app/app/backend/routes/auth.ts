import express from "express"
import passport from "passport"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { generateToken, createAuthCookie, verifyToken } from "@/lib/auth"
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

const router = express.Router()

interface AuthenticatedRequest extends express.Request {
  user?: AuthUser
}

// Register endpoint with enhanced security
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, age, gender } = req.body

    // Enhanced email validation
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: emailValidation.error,
      })
    }

    // Password strength validation
    const passwordValidation = PasswordSecurity.validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Password does not meet security requirements",
        details: passwordValidation.errors,
      })
    }

    const validatedData = registerSchema.parse({
      name,
      email,
      password,
      age,
      gender,
    })

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    })

    if (existingUser) {
      // Log potential account enumeration attempt
      await logSecurityEvent({
        event: "REGISTRATION_ATTEMPT_EXISTING_EMAIL",
        details: { email: validatedData.email },
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent"),
      })

      return res.status(400).json({
        success: false,
        error: "User already exists with this email",
      })
    }

    // Hash password with enhanced security
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
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

    // Generate token
    const token = generateToken(user)
    const cookie = createAuthCookie(token)

    // Set cookie
    res.cookie(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge * 1000,
      path: cookie.path,
    })

    // Log successful registration
    await logSecurityEvent({
      userId: user.id,
      event: "USER_REGISTERED",
      details: { email: user.email, provider: "email" },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    })

    // Return user data (without password)
    const { password: _password, ...userWithoutPassword } = user
    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: "Registration successful",
    })
  } catch (error: unknown) {
    console.error("Registration error:", error)

    if (error && typeof error === 'object' && 'errors' in error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: (error as { errors: unknown }).errors,
      })
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// Enhanced login endpoint with account lockout
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      })
    }

    // Check account lockout
    const lockoutStatus = await checkAccountLockout(email.toLowerCase())
    if (lockoutStatus.isLocked) {
      await logSecurityEvent({
        event: "LOGIN_ATTEMPT_LOCKED_ACCOUNT",
        details: {
          email,
          lockoutEnd: lockoutStatus.lockoutEnd,
        },
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent"),
      })

      return res.status(423).json({
        success: false,
        error: `Account is locked. Try again after ${lockoutStatus.lockoutEnd?.toLocaleString()}`,
        lockoutEnd: lockoutStatus.lockoutEnd,
      })
    }

    passport.authenticate("local", async (err: Error | null, user: AuthUser | false, info?: { message?: string }) => {
      if (err) {
        console.error("Login error:", err)
        return res.status(500).json({
          success: false,
          error: "Internal server error",
        })
      }

      if (!user) {
        // Record failed login attempt
        await recordFailedLogin(email.toLowerCase())

        await logSecurityEvent({
          event: "LOGIN_FAILED",
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
        // Clear failed login attempts on successful login
        await clearFailedLogins(user.id)

        // Generate token
        const token = generateToken(user)
        const cookie = createAuthCookie(token)

        // Set cookie
        res.cookie(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          maxAge: cookie.maxAge * 1000,
          path: cookie.path,
        })

        // Log successful login
        await logSecurityEvent({
          userId: user.id,
          event: "LOGIN_SUCCESS",
          details: { email: user.email },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent"),
        })

        res.json({
          success: true,
          data: user,
          message: "Login successful",
        })
      } catch (error) {
        console.error("Token generation error:", error)
        res.status(500).json({
          success: false,
          error: "Internal server error",
        })
      }
    })(req, res, next)
  } catch (error) {
    console.error("Login route error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// Enhanced logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies["auth-token"]

    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        await logSecurityEvent({
          userId: payload.userId,
          event: "USER_LOGOUT",
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

    res.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// Get current user endpoint (unchanged but with logging)
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies["auth-token"]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      })
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
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// OAuth routes remain the same but with enhanced logging
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
)

router.get("/google/callback", passport.authenticate("google", { session: false }), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user
    if (!user) {
      return res.redirect(`${process.env.NEXT_PUBLIC_API_URL}/login?error=oauth_failed`)
    }

    // Generate token
    const token = generateToken(user)
    const cookie = createAuthCookie(token)

    // Set cookie
    res.cookie(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge * 1000,
      path: cookie.path,
    })

    // Log OAuth login
    await logSecurityEvent({
      userId: user.id,
      event: "OAUTH_LOGIN_SUCCESS",
      details: { provider: "google", email: user.email },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    })

    // Redirect to home
    res.redirect(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`)
  } catch (error) {
    console.error("Google callback error:", error)
    res.redirect(`${process.env.NEXT_PUBLIC_API_URL}/login?error=oauth_failed`)
  }
})

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  }),
)

router.get("/github/callback", passport.authenticate("github", { session: false }), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user
    if (!user) {
      return res.redirect(`${process.env.NEXT_PUBLIC_API_URL}/login?error=oauth_failed`)
    }

    // Generate token
    const token = generateToken(user)
    const cookie = createAuthCookie(token)

    // Set cookie
    res.cookie(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge * 1000,
      path: cookie.path,
    })

    // Log OAuth login
    await logSecurityEvent({
      userId: user.id,
      event: "OAUTH_LOGIN_SUCCESS",
      details: { provider: "github", email: user.email },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    })

    // Redirect to home
    res.redirect(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`)
  } catch (error) {
    console.error("GitHub callback error:", error)
    res.redirect(`${process.env.NEXT_PUBLIC_API_URL}/login?error=oauth_failed`)
  }
})

export default router
