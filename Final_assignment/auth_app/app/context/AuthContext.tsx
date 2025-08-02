"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react"
import type { AuthUser, LoginInput, RegisterInput } from "@/lib/types"
import { API_ROUTES } from "@/lib/constants"
import { toast } from "sonner"

// Enhanced types for better error handling
interface AuthResult {
  success: boolean
  error?: string
}

interface UpdateProfileResult {
  success: boolean
  error?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (data: LoginInput) => Promise<AuthResult>
  register: (data: RegisterInput) => Promise<AuthResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (data: FormData) => Promise<UpdateProfileResult>
}

// Constants for fetch options
const FETCH_OPTIONS = {
  JSON_HEADERS: {
    "Content-Type": "application/json",
  },
  DEFAULT_OPTIONS: {
    credentials: "include" as RequestCredentials,
  },
} as const

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  
  // Ref to track component mount status for cleanup
  const isMountedRef = useRef(true)
  
  // AbortController for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    initializeAuth()
    
    return () => {
      isMountedRef.current = false
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Enhanced API fetch wrapper with retry logic and error handling
  const apiFetch = useCallback(async (
    url: string, 
    options: RequestInit = {},
    retries = 1
  ): Promise<Response> => {
    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchOptions: RequestInit = {
      ...FETCH_OPTIONS.DEFAULT_OPTIONS,
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        // Add CSRF token for state-changing operations
        ...(csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET') 
          ? { 'X-CSRF-Token': csrfToken } 
          : {}),
      },
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions)
        
        // If request was successful or client error (4xx), don't retry
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response
        }
        
        // Server error (5xx) - retry if not last attempt
        if (attempt === retries) {
          return response
        }
        
        // Exponential backoff delay
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000)
        await new Promise(resolve => setTimeout(resolve, delay))
        
      } catch (error) {
        // If aborted, don't retry
        if (error instanceof Error && error.name === 'AbortError') {
          throw error
        }
        
        // Network error - retry if not last attempt
        if (attempt === retries) {
          throw error
        }
        
        // Exponential backoff delay
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new Error('Max retries exceeded')
  }, [csrfToken])

  // Initialize authentication and CSRF token
  const initializeAuth = useCallback(async () => {
    try {
      // Fetch CSRF token first
      await fetchCsrfToken()
      // Then check authentication
      await checkAuth()
    } catch (error) {
      console.error("Auth initialization failed:", error)
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Fetch CSRF token for secure requests
  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await apiFetch('/api/security/csrf-token')
      if (response.ok) {
        const data = await response.json()
        if (data.success && isMountedRef.current) {
          setCsrfToken(data.token)
        }
      }
    } catch (error) {
      // CSRF token is optional, don't fail initialization
      console.warn("CSRF token fetch failed:", error)
    }
  }, [apiFetch])

  const checkAuth = useCallback(async () => {
    try {
      const response = await apiFetch(API_ROUTES.AUTH.ME)

      if (response.ok) {
        const data = await response.json()
        if (data.success && isMountedRef.current) {
          setUser(data.data)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Auth check failed:", error)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [apiFetch])

  const login = useCallback(async (data: LoginInput): Promise<AuthResult> => {
    try {
      toast.loading("Signing in...", { id: "login" })
      const response = await apiFetch(API_ROUTES.AUTH.LOGIN, {
        method: "POST",
        headers: FETCH_OPTIONS.JSON_HEADERS,
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        if (isMountedRef.current) {
          setUser(result.data)
          toast.success("Login successful!", { id: "login" })
        }
        return { success: true }
      }
      toast.error(result.error || "Login failed", { id: "login" })
      return { success: false, error: result.error || "Login failed" }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.dismiss("login")
        return { success: false, error: "Request cancelled" }
      }
      console.error("Login failed:", error)
      toast.error("Network or server error", { id: "login" })
      return { success: false, error: "Network or server error" }
    }
  }, [apiFetch])

  const register = useCallback(async (data: RegisterInput): Promise<AuthResult> => {
    try {
      toast.loading("Creating account...", { id: "register" })
      const response = await apiFetch(API_ROUTES.AUTH.REGISTER, {
        method: "POST",
        headers: FETCH_OPTIONS.JSON_HEADERS,
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        if (isMountedRef.current) {
          setUser(result.data)
          toast.success("Account created successfully!", { id: "register" })
        }
        return { success: true }
      }
      toast.error(result.error || "Registration failed", { id: "register" })
      return { success: false, error: result.error || "Registration failed" }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.dismiss("register")
        return { success: false, error: "Request cancelled" }
      }
      console.error("Registration failed:", error)
      toast.error("Network or server error", { id: "register" })
      return { success: false, error: "Network or server error" }
    }
  }, [apiFetch])

  const logout = useCallback(async () => {
    try {
      toast.loading("Signing out...", { id: "logout" })
      await apiFetch(API_ROUTES.AUTH.LOGOUT, {
        method: "POST",
      })
      if (isMountedRef.current) {
        setUser(null)
        toast.success("Logged out successfully", { id: "logout" })
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Logout failed:", error)
        toast.error("Logout failed", { id: "logout" })
      }
      // Always clear user on logout attempt
      if (isMountedRef.current) {
        setUser(null)
      }
    }
  }, [apiFetch])

  const updateProfile = useCallback(async (formData: FormData): Promise<UpdateProfileResult> => {
    try {
      toast.loading("Updating profile...", { id: "profile-update" })
      const response = await apiFetch(API_ROUTES.PROFILE, {
        method: "PUT",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        if (isMountedRef.current) {
          setUser(result.data)
          toast.success("Profile updated successfully!", { id: "profile-update" })
        }
        return { success: true }
      }
      toast.error(result.error || "Profile update failed", { id: "profile-update" })
      return { success: false, error: result.error || "Profile update failed" }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.dismiss("profile-update")
        return { success: false, error: "Request cancelled" }
      }
      console.error("Profile update failed:", error)
      toast.error("Network or server error", { id: "profile-update" })
      return { success: false, error: "Network or server error" }
    }
  }, [apiFetch])

  const refreshUser = useCallback(async () => {
    await checkAuth()
  }, [checkAuth])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
  }), [user, loading, login, register, logout, refreshUser, updateProfile])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
