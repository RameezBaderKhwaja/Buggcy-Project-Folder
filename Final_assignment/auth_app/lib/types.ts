import type { User, Role } from "@prisma/client"
import type { z } from "zod"
import type {
  loginSchema,
  registerSchema,
  profileUpdateSchema,
  changePasswordSchema,
  setPasswordSchema,
} from "./validators"

// The user object stored in the session (including password for password status checks)
export type AuthUser = Omit<User, "resetToken" | "resetExpires">

// The user object returned by the API
export type PublicUser = Omit<AuthUser, "email" | "provider" | "providerId" | "updatedAt" | "password">


export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type SetPasswordInput = z.infer<typeof setPasswordSchema>


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
  providerStats: Array<{ provider: string; count: number }>
  recentRegistrations: number
  usersWithPhotos: number
  usersWithCompleteProfiles: number
  profileCompletionPercentage: number
  thisMonthRegistrations: number
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
