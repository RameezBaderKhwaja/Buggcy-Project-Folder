export const APP_NAME = "AuthApp"
export const APP_DESCRIPTION = "A modern authentication app built with Next.js, Express, and Prisma."

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
  PROFILE: "/api/auth/profile",
  CHANGE_PASSWORD: "/api/auth/profile/change-password",
  SET_PASSWORD: "/api/auth/profile/set-password",
  STATS: {
    DASHBOARD: "/api/stats/dashboard",
  },
} as const

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
]

export const ROLE_OPTIONS = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
]

export const PASSWORD_STRENGTH = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
}
