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
} from "./middleware/security"
import { logSecurityEvent } from "@/lib/security"
import type { IncomingMessage, ServerResponse } from "http"

const app = express()

app.set("trust proxy", 1)
app.use(requestLogger)
app.use(securityHeaders)
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
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
)
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

const globalLimiter = createRateLimiter({
  maxAttempts: 1000,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again later.",
})
app.use(globalLimiter)

const authLimiter = createRateLimiter({
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many authentication attempts, please try again later.",
})
app.use("/auth", authLimiter)

const passwordResetLimiter = createRateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000,
  message: "Too many password reset attempts, please try again later.",
})
app.use("/security/password-reset", passwordResetLimiter)

app.use(
  express.json({
    limit: "10mb",
    verify(
      req: IncomingMessage & { rawBody?: Buffer },
      res: ServerResponse,
      buf: Buffer,
      encoding: string,
    ) {
      req.rawBody = buf
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
app.use(sanitizeInputs)
app.use(passport.initialize())

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

app.use("*", (req, res) => {
  res.status(404).json({ success: false, error: "Route not found" })
})

app.use(
  (
    err: Error & { status?: number },
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Express error:", err)
    if (err.status === 401 || err.status === 403) {
      logSecurityEvent({
        type: "SECURITY_ERROR",
        details: {
          error: err.message,
          stack: err.stack,
          url: req.url,
          method: req.method,
        },
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "",
      }).catch(console.error)
    }
    const isDev = process.env.NODE_ENV === "development"
    res.status(err.status || 500).json({
      success: false,
      error: err.status === 429 ? err.message : "Internal server error",
      ...(isDev && { details: err.message, stack: err.stack }),
    })
  },
)

export { app }
