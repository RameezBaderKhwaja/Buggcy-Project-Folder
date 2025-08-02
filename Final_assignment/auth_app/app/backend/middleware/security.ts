import rateLimit from "express-rate-limit"
import type { Request, Response, NextFunction } from "express"
import { logSecurityEvent } from "@/lib/security"

// Rate limiting configurations
export const createRateLimiter = (options: {
  maxAttempts: number
  windowMs: number
  message?: string
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.maxAttempts,
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req: Request, res: Response) => {
      try {
        await logSecurityEvent({
          type: "RATE_LIMIT_EXCEEDED",
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          details: { endpoint: req.path, method: req.method },
        })
      } catch (err: unknown) {
        console.error("Log error (rate limit):", err)
      }
      res.status(429).json({
        success: false,
        error: options.message || "Too many requests, please try again later.",
      })
    },
  })
}

// Different rate limits for different endpoints
export const authRateLimit = createRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  message: "Too many authentication attempts"
})
export const generalRateLimit = createRateLimiter({
  maxAttempts: 100,
  windowMs: 15 * 60 * 1000
})
export const strictRateLimit = createRateLimiter({
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
  message: "Too many sensitive requests"
})

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - start
    const isError = res.statusCode >= 400

    if (isError || req.path.includes("/auth/")) {
      logSecurityEvent({
        type: isError ? "REQUEST_ERROR" : "REQUEST_SUCCESS",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
        },
      }).catch((err) => console.error("Log error (requestLogger):", err))
    }
  })

  next()
}

// Input sanitization middleware
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: Record<string, unknown>) => {
    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          sanitize(item as Record<string, unknown>)
        }
      })
    } else if (typeof obj === "object" && obj !== null) {
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
  }

  if (req.body && typeof req.body === "object") {
    sanitize(req.body as Record<string, unknown>)
  }
  if (req.query && typeof req.query === "object") {
    sanitize(req.query as Record<string, unknown>)
  }
  if (req.params && typeof req.params === "object") {
    sanitize(req.params as Record<string, unknown>)
  }

  next()
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // Remove deprecated X-XSS-Protection
  // Add Content-Security-Policy (CSP)
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src *; script-src 'self'; style-src 'self';")
  next()
}

// CSRF protection middleware (basic implementation)
// NOTE: For production, use express-session/cookie-session and a robust CSRF library like csurf or double-submit cookie pattern.
export const csrfProtection = (req: Request & { session?: { csrfToken?: string } }, res: Response, next: NextFunction) => {
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
