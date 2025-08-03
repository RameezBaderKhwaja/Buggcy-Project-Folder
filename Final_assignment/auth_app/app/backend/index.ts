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
import {
  createRateLimiter,
  sanitizeInputs,
  securityHeaders,
  requestLogger,
  csrfProtection,
} from "./middleware/security"
import { logSecurityEvent } from "@/lib/security"
import type { IncomingMessage, ServerResponse } from "http"

const app = express()

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1)

// Apply global middlewares
app.use(requestLogger)
app.use(securityHeaders)

// Enhanced Helmet configuration with better security defaults
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
    // Use default COEP policy for better security (removed override)
    crossOriginEmbedderPolicy: process.env.NODE_ENV === "production",
    hsts: { 
      maxAge: 31536000, 
      includeSubDomains: true, 
      preload: true 
    },
    // Additional security headers
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
)

// CORS configuration
app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-CSRF-Token",
    ],
    exposedHeaders: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
  }),
)

// Rate limiting configuration
const globalLimiter = createRateLimiter({
  maxAttempts: 2000,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again later.",
})
app.use(globalLimiter)

const authLimiter = createRateLimiter({
  maxAttempts: 20,
  windowMs: 15 * 60 * 1000,
  message: "Too many authentication attempts, please try again later.",
})
app.use("/auth", authLimiter)

const passwordResetLimiter = createRateLimiter({
  maxAttempts: 6,
  windowMs: 60 * 60 * 1000,
  message: "Too many password reset attempts, please try again later.",
})
app.use("/security/password-reset", passwordResetLimiter)

// Body parsing with reduced limits for better security
const bodyLimit = process.env.NODE_ENV === "production" ? "5mb" : "10mb"

app.use(
  express.json({
    limit: bodyLimit,
    verify(
      req: IncomingMessage & { rawBody?: Buffer },
      res: ServerResponse,
      buf: Buffer,
    ) {
      // Only store rawBody for webhook endpoints that need it
      if (req.url?.includes('/webhooks/')) {
        req.rawBody = buf
      }
    },
  }),
)
app.use(
  express.urlencoded({
    extended: true,
    limit: bodyLimit,
  }),
)

app.use(cookieParser())
app.use(sanitizeInputs)

// CSRF Protection for state-changing operations (disabled for better performance)
// app.use(csrfProtection)

app.use(passport.initialize())

// API Documentation endpoint - simple JSON documentation
app.get("/api-docs", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" })
  }
  
  res.json({
    title: "Auth App API",
    version: "1.0.0",
    description: "Authentication and User Management API",
    endpoints: {
      auth: {
        "POST /auth/login": "User login",
        "POST /auth/register": "User registration",
        "POST /auth/logout": "User logout",
        "GET /auth/me": "Get current user",
      },
      users: {
        "GET /users": "Get all users (admin only)",
        "GET /users/:id": "Get user by ID",
      },
      profile: {
        "GET /profile": "Get user profile",
        "PUT /profile": "Update user profile",
      },
      stats: {
        "GET /stats": "Get application statistics",
      },
      security: {
        "GET /security/status": "Get security status",
        "POST /security/password-reset": "Request password reset",
      },
    },
    security: {
      type: "Cookie-based authentication",
      cookieName: "auth-token",
    },
  })
})

app.use("/auth", authRoutes)
app.use("/users", userRoutes)
app.use("/profile", profileRoutes)
app.use("/stats", statsRoutes)
app.use("/security", securityRoutes)

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

// Enhanced 404 handler with logging
app.use((req, res, next) => {
  // Log 404 errors for monitoring
  logSecurityEvent({
    type: "REQUEST_ERROR",
    details: {
      error: "Route not found",
      url: req.url,
      method: req.method,
      statusCode: 404,
    },
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "",
  }).catch(console.error)

  res.status(404).json({ 
    success: false, 
    error: "Route not found",
    timestamp: new Date().toISOString(),
  })
})

// Enhanced global error handler with comprehensive logging
app.use(
  (
    err: Error & { status?: number; code?: string },
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const statusCode = err.status || 500
    const isDev = process.env.NODE_ENV === "development"
    
    // Enhanced error logging
    console.error(`[${errorId}] Express error:`, {
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    })

    // Log security-related errors
    if (statusCode === 401 || statusCode === 403 || statusCode >= 500) {
      logSecurityEvent({
        type: statusCode >= 500 ? "SYSTEM_ERROR" : "SECURITY_ERROR",
        details: {
          errorId,
          error: err.message,
          code: err.code,
          stack: isDev ? err.stack : undefined,
          url: req.url,
          method: req.method,
          statusCode,
        },
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "",
      }).catch(console.error)
    }

    // Send appropriate error response
    const errorResponse: any = {
      success: false,
      error: statusCode === 429 ? err.message : 
             statusCode >= 500 ? "Internal server error" : 
             err.message || "An error occurred",
      errorId,
      timestamp: new Date().toISOString(),
    }

    // Include detailed error info in development
    if (isDev) {
      errorResponse.details = {
        message: err.message,
        stack: err.stack,
        code: err.code,
      }
    }

    res.status(statusCode).json(errorResponse)
  },
)

export { app }

