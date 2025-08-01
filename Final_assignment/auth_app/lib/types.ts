export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: "USER" | "ADMIN"
  image: string | null
  age: number | null
  gender: string | null
  provider: string
  providerId: string | null
  createdAt: Date
  updatedAt: Date
}
export interface JWTPayload {
  userId: string
  email: string
  role: "USER" | "ADMIN"
  iat?: number
  exp?: number
}

export interface SecurityEvent {
  id: string
  event: string
  userId: string | null
  ipAddress: string
  userAgent: string
  success: boolean
  details: Record<string, unknown> | string
<<<<<<< HEAD
  timestamp: string | Date
=======
  timestamp: Date
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
  user?: {
    email: string
    name: string | null
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UserStats {
  totalUsers: number
  genderStats: Array<{ gender: string; count: number }>
  ageGroups: Record<string, number>
  monthlyRegistrations: Record<string, number>
}

export interface SecurityStats {
  totalEvents: number
  recentEvents: SecurityEvent[]
  eventTypes: Record<string, number>
  suspiciousActivity: number
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  age: number
  gender: "male" | "female" | "other" | "prefer-not-to-say"
<<<<<<< HEAD
}

=======
}
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
