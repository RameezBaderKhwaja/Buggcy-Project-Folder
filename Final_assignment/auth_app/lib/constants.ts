export const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production"
export const JWT_EXPIRES_IN = "7d"

export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    OAUTH: {
      GOOGLE: "/api/auth/oauth/google",
      GITHUB: "/api/auth/oauth/github",
    },
  },
  USERS: "/api/users",
  PROFILE: "/api/profile",
  STATS: "/api/stats",
  SECURITY: "/api/security",
} as const

export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  API_KEY: process.env.CLOUDINARY_API_KEY || "",
  API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  UPLOAD_PRESET: "user_profiles",
}

export const DATABASE_URL = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/authapp"

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const

export const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  AGE_MIN: 18,
  AGE_MAX: 120,
} as const
