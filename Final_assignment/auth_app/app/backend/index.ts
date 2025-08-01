import express from "express"
import helmet from "helmet"
import cors from "cors"
import cookieParser from "cookie-parser"
import passport from "passport"
import "./passport"
import authRoutes from "./routes/auth"
import userRoutes from "./routes/user"
import profileRoutes from "./routes/profile"
import statsRoutes from "./routes/stats"
import securityRoutes from "./routes/security"
import { createRateLimiter, sanitizeInputs, securityHeaders, requestLogger } from "./middleware/security"

const app = express()

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1)

// Request logging
app.use(requestLogger)

// Security headers
app.use(securityHeaders)

// Enhanced helmet configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:"],
        connectSrc: ["'self'", "https:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
)

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-CSRF-Token"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
  }),
)

// Global rate limiting
const globalLimiter = createRateLimiter({
  maxAttempts: 1000,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many requests from this IP, please try again later.",
})
app.use(globalLimiter)

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimiter({
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many authentication attempts, please try again later.",
})
app.use("/auth", authLimiter)

// Very strict rate limiting for password reset
const passwordResetLimiter = createRateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many password reset attempts, please try again later.",
})
app.use("/security/password-reset", passwordResetLimiter)

// Body parsing middleware with size limits
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      // Store raw body for webhook verification if needed
      ;(req as any).rawBody = buf
    },
  }),
)
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
)
app.use(cookieParser())

// Input sanitization
app.use(sanitizeInputs)

// Passport middleware
app.use(passport.initialize())

// Routes
app.use("/auth", authRoutes)
app.use("/users", userRoutes)
app.use("/profile", profileRoutes)
app.use("/stats", statsRoutes)
app.use("/security", securityRoutes)

// Health check with security info
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    security: {
      headers: "enabled",
      rateLimit: "enabled",
      inputSanitization: "enabled",
    },
  })
})

// Security endpoint for monitoring
app.get("/security/status", (req, res) => {
  res.json({
    success: true,
    data: {
      securityFeatures: {
        rateLimiting: true,
        inputSanitization: true,
        securityHeaders: true,
        requestLogging: true,
        csrfProtection: true,
        accountLockout: true,
        passwordStrengthValidation: true,
      },
      timestamp: new Date().toISOString(),
    },
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, error: "Route not found" })
})

// Enhanced error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express error:", err)

  // Log security-related errors
  if (err.status === 401 || err.status === 403) {
    const { logSecurityEvent } = require("@/lib/security")
    logSecurityEvent({
      event: "SECURITY_ERROR",
      details: {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
    }).catch(console.error)
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development"

  res.status(err.status || 500).json({
    success: false,
    error: err.status === 429 ? err.message : "Internal server error",
    ...(isDevelopment && {
      details: err.message,
      stack: err.stack,
    }),
  })
})

export { app }
