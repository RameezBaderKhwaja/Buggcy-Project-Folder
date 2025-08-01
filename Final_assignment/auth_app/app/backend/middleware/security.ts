import rateLimit from "express-rate-limit"
import helmet from "helmet"
import type { Request, Response, NextFunction } from "express"
import { SecurityLogger } from "@/lib/security"

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req: Request, res: Response) => {
      await SecurityLogger.logEvent({
        type: "RATE_LIMIT_EXCEEDED",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        details: { endpoint: req.path, method: req.method },
      })

      res.status(429).json({
        success: false,
        error: "Too many requests, please try again later.",
      })
    },
  })
}

// Different rate limits for different endpoints
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5, "Too many authentication attempts")
export const generalRateLimit = createRateLimit(15 * 60 * 1000, 100)
export const strictRateLimit = createRateLimit(15 * 60 * 1000, 3, "Too many sensitive requests")

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on("finish", async () => {
    const duration = Date.now() - start
    const isError = res.statusCode >= 400

    if (isError || req.path.includes("/auth/")) {
      await SecurityLogger.logEvent({
        type: isError ? "REQUEST_ERROR" : "REQUEST_SUCCESS",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
        },
      })
    }
  })

  next()
}

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: Record<string, unknown>) => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        // Basic XSS prevention
        obj[key] = (obj[key] as string)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "")
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key] as Record<string, unknown>)
      }
    }
  }

  if (req.body && typeof req.body === "object") {
    sanitize(req.body)
  }

  next()
}

// CSRF protection middleware (basic implementation)
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const token = req.headers["x-csrf-token"] || req.body._csrf
    const sessionToken = req.session?.csrfToken

    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        success: false,
        error: "Invalid CSRF token",
      })
    }
  }

  next()
}
