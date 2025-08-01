import bcrypt from "bcrypt"
import crypto from "crypto"
import { prisma } from "./prisma"
import type { SecurityEvent } from "./types"

// Password security utilities
export class PasswordSecurity {
  private static readonly SALT_ROUNDS = 12
  private static readonly MIN_LENGTH = 8
  private static readonly COMMON_PASSWORDS = [
    "password",
    "123456",
    "password123",
    "admin",
    "qwerty",
    "letmein",
    "welcome",
    "monkey",
    "1234567890",
    "abc123",
  ]

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    feedback: string[]
    errors: string[]
  } {
    const feedback: string[] = []
    const errors: string[] = []
    let score = 0

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`)
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    } else {
      score += 1
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    } else {
      score += 1
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    } else {
      score += 1
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character")
    } else {
      score += 1
    }

    if (this.COMMON_PASSWORDS.some((common) => password.toLowerCase().includes(common.toLowerCase()))) {
      errors.push("Password contains common words or patterns")
      score = Math.max(0, score - 2)
    }

    // Generate helpful feedback
    if (score >= 4) {
      feedback.push("Strong password!")
    } else if (score >= 2) {
      feedback.push("Good start, but could be stronger")
    } else {
      feedback.push("Password needs improvement")
    }
    return {
      isValid: score >= 4 && password.length >= this.MIN_LENGTH,
      score,
      feedback,
      errors,
    }
  }
}

// Account security utilities
export class AccountSecurity {
  private static readonly MAX_LOGIN_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

  static async recordFailedLogin(email: string, ipAddress?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) return

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLogin: new Date(),
      },
    })

    // Log security event
    await SecurityLogger.logEvent({
      type: "FAILED_LOGIN",
      userId: user.id,
      ipAddress: ipAddress || "unknown",
      details: { attempts: "incremented" },
    })
  }

  static async recordSuccessfulLogin(userId: string, ipAddress: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastLogin: new Date(),
      },
    })

    await SecurityLogger.logEvent({
      type: "SUCCESSFUL_LOGIN",
      userId,
      ipAddress,
      details: { resetAttempts: true },
    })
  }

  static async checkAccountLockout(email: string): Promise<{
    isLocked: boolean
    lockoutEnd?: Date
    attemptsRemaining: number
    remainingTime?: number
  }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        failedLoginAttempts: true,
        accountLockedUntil: true,
        lastFailedLogin: true,
      },
    })

    if (!user) {
      return { isLocked: false, attemptsRemaining: this.MAX_LOGIN_ATTEMPTS }
    }

    // Check if account is currently locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const remainingTime = user.accountLockedUntil.getTime() - Date.now()
      return { 
        isLocked: true, 
        lockoutEnd: user.accountLockedUntil,
        attemptsRemaining: 0,
        remainingTime 
      }
    }

    // Check if we need to lock the account
    if (user.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + this.LOCKOUT_DURATION)

      await prisma.user.update({
        where: { id: userId },
        data: { accountLockedUntil: lockUntil },
      })

      await SecurityLogger.logEvent({
        type: "ACCOUNT_LOCKED",
        userId: user.id,
        details: {
          attempts: user.failedLoginAttempts,
          lockDuration: this.LOCKOUT_DURATION,
        },
      })

      return { 
        isLocked: true, 
        lockoutEnd: lockUntil,
        attemptsRemaining: 0,
        remainingTime: this.LOCKOUT_DURATION 
      }
    }

    const attemptsRemaining = this.MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts
    return { isLocked: false, attemptsRemaining }
  }

  static async clearFailedLogins(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    })
  }
}

// Security event logging
export class SecurityLogger {
  static async logEvent(event: {
    type: string
    userId?: string
    ipAddress?: string
    userAgent?: string
    details?: Record<string, unknown>
  }): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          event: event.type,
          userId: event.userId,
          ipAddress: event.ipAddress || "unknown",
          userAgent: event.userAgent || "unknown",
          success: !event.type.includes("FAILED"),
          details: JSON.stringify(event.details || {}),
        },
      })
    } catch (error) {
      console.error("Failed to log security event:", error)
    }
  }

  static async getRecentEvents(limit = 50): Promise<SecurityEvent[]> {
    const logs = await prisma.securityLog.findMany({
      take: limit,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    return logs.map(log => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
    })) as SecurityEvent[]
  }

  static async getSecurityStats(): Promise<{
    totalEvents: number
    recentEvents: SecurityEvent[]
    eventTypes: Record<string, number>
    suspiciousActivity: number
  }> {
    const [totalEvents, recentEvents, eventCounts] = await Promise.all([
      prisma.securityLog.count(),
      this.getRecentEvents(20),
      prisma.securityLog.groupBy({
        by: ["event"],
        _count: { event: true },
      }),
    ])

    const eventTypes = eventCounts.reduce(
      (acc, item) => {
        acc[item.event] = item._count.event
        return acc
      },
      {} as Record<string, number>,
    )

    const suspiciousActivity = await prisma.securityLog.count({
      where: {
        OR: [{ event: "FAILED_LOGIN" }, { event: "ACCOUNT_LOCKED" }, { event: "SUSPICIOUS_ACTIVITY" }],
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    return {
      totalEvents,
      recentEvents,
      eventTypes,
      suspiciousActivity,
    }
  }
}

// Token utilities
export class TokenSecurity {
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString("hex")
  }

  static generateCSRFToken(): string {
    return this.generateSecureToken(32)
  }

  static generatePasswordResetToken(): {
    token: string
    expires: Date
  } {
    return {
      token: this.generateSecureToken(),
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    }
  }

  static async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return null
    }

    const { token, expires } = this.generatePasswordResetToken()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetExpires: expires,
      },
    })

    await SecurityLogger.logEvent({
      type: "PASSWORD_RESET_REQUESTED",
      userId: user.id,
      details: { email },
    })

    return token
  }

  static async validatePasswordResetToken(token: string): Promise<string | null> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date(),
        },
      },
    })

    return user?.id || null
  }
}

// Email validation utility
export function validateEmail(email: string): {
  isValid: boolean
  error?: string
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    return { isValid: false, error: "Email is required" }
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" }
  }
  
  if (email.length > 254) {
    return { isValid: false, error: "Email is too long" }
  }
  
  return { isValid: true }
}

// Export commonly used functions
export const validatePasswordStrength = PasswordSecurity.validatePasswordStrength
export const checkAccountLockout = AccountSecurity.checkAccountLockout
export const recordFailedLogin = AccountSecurity.recordFailedLogin
export const clearFailedLogins = AccountSecurity.clearFailedLogins
export const logSecurityEvent = SecurityLogger.logEvent
export const generateCSRFToken = TokenSecurity.generateCSRFToken
