"use client"

import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { motion } from "framer-motion"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        
        const targetRoute = user.role === "ADMIN" ? "/dashboard" : "/profile"
        router.replace(targetRoute)
      } else {
    
        router.replace("/login")
      }
    }
  }, [user, loading, router])

  // once loading is complete.
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
