"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { AuthUser, LoginInput, RegisterInput } from "@/lib/types"
import { API_ROUTES } from "@/lib/constants"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (data: LoginInput) => Promise<boolean>
  register: (data: RegisterInput) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (data: FormData) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch(API_ROUTES.AUTH.ME, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data)
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (data: LoginInput): Promise<boolean> => {
    try {
      const response = await fetch(API_ROUTES.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      })

      const result = await response.json()

      if (result.success) {
        setUser(result.data)
        return true
      }
      return false
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
  }

  const register = async (data: RegisterInput): Promise<boolean> => {
    try {
      const response = await fetch(API_ROUTES.AUTH.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      })

      const result = await response.json()

      if (result.success) {
        setUser(result.data)
        return true
      }
      return false
    } catch (error) {
      console.error("Registration failed:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch(API_ROUTES.AUTH.LOGOUT, {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const updateProfile = async (formData: FormData): Promise<boolean> => {
    try {
      const response = await fetch(API_ROUTES.PROFILE, {
        method: "PUT",
        body: formData,
        credentials: "include",
      })

      const result = await response.json()

      if (result.success) {
        setUser(result.data)
        return true
      }
      return false
    } catch (error) {
      console.error("Profile update failed:", error)
      return false
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
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
