"use client"

import { useAuth } from "@/app/context/AuthContext"
import { motion } from "framer-motion"
import { ArrowRight, Users, Shield, Zap, Globe } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AuthApp</span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Secure Authentication
              <span className="text-blue-600 block">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A full-stack authentication solution with modern security features, OAuth integration, and beautiful user
              experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    href="/register"
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with modern technologies and security best practices
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure by Default",
                description: "JWT tokens, password hashing, and security monitoring",
              },
              {
                icon: Users,
                title: "OAuth Integration",
                description: "Login with Google, GitHub, and other providers",
              },
              {
                icon: Zap,
                title: "Fast & Modern",
                description: "Built with Next.js, TypeScript, and Tailwind CSS",
              },
              {
                icon: Globe,
                title: "Full-Stack",
                description: "Complete authentication system with database",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 mb-8">Join thousands of users who trust our authentication system</p>

            {!user && (
              <Link
                href="/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold inline-flex items-center space-x-2"
              >
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">AuthApp</span>
          </div>
          <p className="text-gray-400">© 2024 AuthApp. Built with Next.js and TypeScript.</p>
        </div>
      </footer>
    </div>
  )
}
