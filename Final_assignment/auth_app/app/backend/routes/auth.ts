import express from "express"
import passport from "passport"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validators"
import { expressWithAuth } from "@/lib/middleware"
import { generalRateLimit, csrfProtection, sanitizeInputs } from "../middleware/security"
import { logSecurityEvent } from "@/lib/security"

const router = express.Router()

// Apply security middlewares
router.use(generalRateLimit, csrfProtection, sanitizeInputs)

// =================================
// Login Route
// =================================
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err: Error, user: Express.User, info: { message: string }) => {
    if (err) return next(err)
    if (!user) {
      return res.status(401).json({ success: false, error: info.message || "Invalid credentials" })
    }
    req.logIn(user, (err) => {
      if (err) return next(err)
      res.json({ success: true, data: user, message: "Login successful" })
    })
  })(req, res, next)
})

// =================================
// Logout Route
// =================================
router.post("/logout", expressWithAuth, (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err)
      return res.status(500).json({ success: false, error: "Logout failed" })
    }
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie("connect.sid")
        res.json({ success: true, message: "Logged out successfully" })
      })
    } else {
      res.clearCookie("connect.sid")
      res.json({ success: true, message: "Logged out successfully" })
    }
  })
})

// =================================
// Register Route
// =================================
router.post("/register", async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body)
    const { email, password, name } = validatedData

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ success: false, error: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
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
        createdAt: true,
        updatedAt: true,
        failedLoginAttempts: true,
        accountLockedUntil: true,
        lastLogin: true,
        lastFailedLogin: true,
      },
    })

    req.logIn(newUser, (err) => {
      if (err) {
        console.error("Login after register error:", err)
        // Even if login fails, registration was successful
        return res.status(201).json({ 
          success: true, 
          data: newUser, 
          message: "Registration successful, but auto-login failed." 
        })
      }
      res.status(201).json({ success: true, data: newUser, message: "Registration successful" })
    })

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Validation failed", details: error.flatten().fieldErrors })
    }
    console.error("Registration error:", error)
    res.status(500).json({ success: false, error: "An internal server error occurred." })
  }
})

// =================================
// Get Current User (/me) Route
// =================================
router.get("/me", expressWithAuth, (req, res) => {
  res.json({ success: true, data: req.user })
})

// =================================
// OAuth Routes
// =================================

// Google
router.get("/oauth/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get("/oauth/google/callback", 
  passport.authenticate("google", {
    failureRedirect: "/login?error=oauth",
    successRedirect: "/dashboard",
  })
)

// GitHub
router.get("/oauth/github", passport.authenticate("github", { scope: ["user:email"] }))
router.get("/oauth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login?error=oauth",
    successRedirect: "/dashboard",
  })
)

export default router
