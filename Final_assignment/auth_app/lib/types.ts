import type { User, Role } from "@prisma/client"
import type { z } from "zod"
import type {
  loginSchema,
  registerSchema,
  profileUpdateSchema,
  changePasswordSchema,
} from "./validators"

// =================================
// Database & Session
// =================================

// The user object stored in the session
export type AuthUser = Omit<User, "password" | "resetToken" | "resetExpires">

// The user object returned by the API
export type PublicUser = Omit<AuthUser, "email" | "provider" | "providerId" | "updatedAt">

// =================================
// API Route Inputs
// =================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// =================================
// Security & Stats
// =================================

export type SecurityEvent = {
  id: string
  type: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  createdAt: Date
}

export interface UserStats {
  totalUsers: number
  genderStats: Array<{ gender: string; count: number }>
  ageGroups: Record<string, number>
  monthlyRegistrations: Record<string, number>
}

export type RegistrationStats = {
  total: number
  lastDay: number
  lastWeek: number
  lastMonth: number
}

export type ActivityStats = {
  logins: number
  registrations: number
  passwordResets: number
  profileUpdates: number
}

export type Stats = {
  users: UserStats
  registrations: RegistrationStats
  activity: ActivityStats
}

export interface JWTPayload {
  userId: string
  email: string
  role: Role
}
