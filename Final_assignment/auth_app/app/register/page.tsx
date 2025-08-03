"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import { motion } from "framer-motion"
import { Eye, EyeOff, Github, Mail, Lock, User, Calendar, Users, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { RegisterInput } from "@/lib/types"
import { usePasswordStrength } from "@/hooks/use-password-strength"
import { toast } from "sonner"
import { z } from "zod"

// Route constants
const ROUTES = {
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
  OAUTH: (provider: string) => `/api/auth/oauth/${provider}`,
} as const

// Form validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  age: z.string().refine((val) => {
    const num = Number(val)
    return !isNaN(num) && num >= 18 && num <= 120
  }, "Age must be between 18-120"),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"])
})

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Refs for cleanup
  const isMountedRef = useRef(true)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [formData, setFormData] = useState<Omit<RegisterInput, "age"> & { age: string }>({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "male",
  })

  const passwordStrength = usePasswordStrength(formData.password)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  // Clear error when user starts typing
  useEffect(() => {
    if (error && (formData.name || formData.email || formData.password || formData.age)) {
      setError("")
    }
  }, [formData.name, formData.email, formData.password, formData.age, error])

  // Generate CSRF state for OAuth
  const generateOAuthState = useCallback(() => {
    if (typeof window !== 'undefined' && window.crypto) {
      return window.crypto.randomUUID()
    }
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }, [])

  // Form validation
  const validateForm = useCallback((): boolean => {
    try {
      registerSchema.parse(formData)
      setFormErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message
          }
        })
        setFormErrors(errors)
      }
      return false
    }
  }, [formData])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }, [formErrors])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      return
    }
    
    // Additional password strength check
    if (!passwordStrength.isValid) {
      setError("Please create a stronger password")
      return
    }
    
    setLoading(true)
    setError("")

    try {
      const registerData: RegisterInput = {
        ...formData,
        age: Number.parseInt(formData.age),
        gender: formData.gender as RegisterInput["gender"],
      }

      const { success, error } = await register(registerData)
      
      // Check if component is still mounted
      if (!isMountedRef.current) return
      
      if (success) {
        // Don't show toast here as it's handled in AuthContext
        const redirectUrl = "/dashboard" // Let middleware handle the actual redirect
        router.push(redirectUrl)
      } else {
        setError(error || "Registration failed. Please try again.")
        // Don't show toast here as it's handled in AuthContext
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError("An error occurred during registration")
        // Don't show toast here as it's handled in AuthContext
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [formData, passwordStrength.isValid, register, router, validateForm])

  const handleOAuthLogin = useCallback((provider: "google" | "github") => {
    // Clear any existing errors
    setError("")
    
    // Generate and store CSRF state
    const state = generateOAuthState()
    if (typeof window !== 'undefined') {
      localStorage.setItem('oauth_state', state)
    }
    
    // Redirect to OAuth provider with state parameter
    const oauthUrl = `${ROUTES.OAUTH(provider)}?state=${encodeURIComponent(state)}`
    window.location.href = oauthUrl
  }, [generateOAuthState])

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return "bg-red-500"
    if (passwordStrength.score <= 2) return "bg-yellow-500"
    if (passwordStrength.score <= 3) return "bg-blue-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 1) return "Weak"
    if (passwordStrength.score <= 2) return "Fair"
    if (passwordStrength.score <= 3) return "Good"
    return "Strong"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us and start your journey today</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2"
              role="alert"
              aria-live="polite"
              id="registration-error"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </motion.div>
          )}

          <form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            aria-describedby={error ? "registration-error" : undefined}
            noValidate
          >
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    formErrors.name 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "name-error" : undefined}
                />
              </div>
              {formErrors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    formErrors.email 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? "email-error" : undefined}
                />
              </div>
              {formErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    formErrors.password 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Create a strong password"
                  aria-invalid={!!formErrors.password}
                  aria-describedby={formData.password ? "password-feedback" : formErrors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {formErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                  {formErrors.password}
                </p>
              )}

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2" id="password-feedback" aria-live="polite">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={passwordStrength.score} aria-valuemin={0} aria-valuemax={5}>
                      <div
                        className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{getPasswordStrengthText()}</span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-gray-500 space-y-1" aria-label="Password improvement suggestions">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index}>• {feedback}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Age and Gender Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="120"
                    required
                    value={formData.age}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      formErrors.age 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Age"
                    aria-invalid={!!formErrors.age}
                    aria-describedby={formErrors.age ? "age-error" : "age-help"}
                  />
                </div>
                {formErrors.age ? (
                  <p id="age-error" className="mt-1 text-sm text-red-600" role="alert">
                    {formErrors.age}
                  </p>
                ) : (
                  <p id="age-help" className="text-xs text-gray-500 mt-1">18-120 years</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    aria-describedby="gender-help"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <p id="gender-help" className="text-xs text-gray-500 mt-1">Select your gender</p>
              </div>
            </div>

            {/* Password Strength Warning */}
            {formData.password && !passwordStrength.isValid && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm">Please create a stronger password to continue</span>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: (loading || !passwordStrength.isValid) ? 1 : 1.02 }}
              whileTap={{ scale: (loading || !passwordStrength.isValid) ? 1 : 0.98 }}
              type="submit"
              disabled={loading || !passwordStrength.isValid}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-busy={loading}
              aria-describedby={loading ? "loading-text" : (!passwordStrength.isValid && formData.password) ? "password-strength-warning" : undefined}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  <span id="loading-text">Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center" role="separator" aria-label="Or continue with social login">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">Or continue with</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthLogin("google")}
              className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Sign up with Google"
              type="button"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handleOAuthLogin("github")}
              className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Sign up with GitHub"
              type="button"
            >
              <Github className="w-5 h-5" aria-hidden="true" />
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link 
                href={ROUTES.LOGIN} 
                className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="Sign in to your existing account"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
