"use client"

import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { motion } from "framer-motion"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!loading && !redirecting) {
      setRedirecting(true)
      
      // Use replace instead of push to avoid browser history pollution
      const targetRoute = user ? "/dashboard" : "/home"
      
      // Small delay to prevent flash and ensure smooth transition
      const timeoutId = setTimeout(() => {
        router.replace(targetRoute)
      }, 100)

      // Cleanup timeout if component unmounts
      return () => clearTimeout(timeoutId)
    }
  }, [user, loading, router, redirecting])

  // Enhanced loading state with better UX
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-4"
        >
          <LoadingSpinner />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Loading AuthApp
            </h2>
            <p className="text-sm text-gray-600">
              Checking your authentication status...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Enhanced redirecting state instead of returning null
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <LoadingSpinner />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-200"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {user ? "Welcome back!" : "Getting started..."}
            </h2>
            <p className="text-sm text-gray-600">
              {user 
                ? "Redirecting you to your dashboard..." 
                : "Taking you to the home page..."
              }
            </p>
          </div>
          
          {/* Progress indicator */}
          <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  // Fallback state (should rarely be reached)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-4"
      >
        <div className="text-6xl mb-4">🔄</div>
        <h2 className="text-xl font-semibold text-gray-900">
          Preparing your experience...
        </h2>
        <p className="text-gray-600 max-w-md">
          If this takes too long, please{" "}
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700 underline font-medium"
          >
            refresh the page
          </button>
        </p>
      </motion.div>
    </div>
  )
}
