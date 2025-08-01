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
    message: options.message || "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req: Request, res: Response) => {
      await logSecurityEvent({
<<<<<<< HEAD
        type: "RATE_LIMIT_EXCEEDED",
=======
        event: "RATE_LIMIT_EXCEEDED",
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
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

  res.on("finish", async () => {
    const duration = Date.now() - start
    const isError = res.statusCode >= 400

    if (isError || req.path.includes("/auth/")) {
      await logSecurityEvent({
<<<<<<< HEAD
        type: isError ? "REQUEST_ERROR" : "REQUEST_SUCCESS",
=======
        event: isError ? "REQUEST_ERROR" : "REQUEST_SUCCESS",
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
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
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
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

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
}

// CSRF protection middleware (basic implementation)
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
