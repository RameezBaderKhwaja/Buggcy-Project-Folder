"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Shield, LogIn, UserPlus } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
      {/* Background shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-full shadow-lg">
            <Shield className="w-16 h-16 text-blue-600" />
          </div>
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Welcome to AuthApp
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-prose mx-auto">
          A secure and modern authentication solution.
          Built with Next.js, this application provides a robust foundation for managing user authentication, including social logins, role-based access control, and advanced security features.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/register')}
            className="w-full sm:w-auto"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Sign Up
          </Button>
        </div>
      </motion.div>

      <footer className="absolute bottom-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AuthApp. All rights reserved.</p>
        <p>A project by YourName</p>
      </footer>
    </div>
  )
}
