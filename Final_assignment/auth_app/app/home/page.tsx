"use client"

import { useAuth } from "@/app/context/AuthContext"
import { motion } from "framer-motion"
import { ArrowRight, Users, Shield, Zap, Globe } from "lucide-react"
import Link from "next/link"
import Head from "next/head"
import { Button } from "@/components/ui/button"

// SEO and metadata
const pageMetadata = {
  title: "AuthApp - Secure Authentication Made Simple",
  description: "A full-stack authentication solution with modern security features, OAuth integration, and beautiful user experience. Built with Next.js, TypeScript, and Tailwind CSS.",
  keywords: "authentication, OAuth, security, Next.js, TypeScript, login, register, JWT",
  ogImage: "/og-image.png", // Add this image to public folder
}

export default function HomePage() {
  const { user } = useAuth()

  return (
    <>
      <Head>
        <title>{pageMetadata.title}</title>
        <meta name="description" content={pageMetadata.description} />
        <meta name="keywords" content={pageMetadata.keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageMetadata.title} />
        <meta property="og:description" content={pageMetadata.description} />
        <meta property="og:image" content={pageMetadata.ogImage} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={pageMetadata.title} />
        <meta property="twitter:description" content={pageMetadata.description} />
        <meta property="twitter:image" content={pageMetadata.ogImage} />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Navigation */}
        <nav 
          className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link 
                href="/" 
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                aria-label="AuthApp home"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <span className="text-xl font-bold text-gray-900">AuthApp</span>
              </Link>

              <div className="flex items-center space-x-4">
                {user?.role === "ADMIN" ? (
                  <Button asChild>
                    <Link
                      href="/dashboard"
                      prefetch={false}
                      aria-label="Go to admin dashboard"
                    >
                      Dashboard
                    </Link>
                  </Button>
                ) : user ? (
                  <Button asChild>
                    <Link
                      href="/profile"
                      aria-label="Go to user profile"
                    >
                      Profile
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link 
                        href="/login"
                        aria-label="Sign in to your account"
                      >
                        Login
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link
                        href="/register"
                        aria-label="Create a new account"
                      >
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="hero-heading">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }}
            >
              <h1 id="hero-heading" className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
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
                    <Button size="lg" asChild>
                      <Link
                        href="/register"
                        className="flex items-center space-x-2"
                        aria-label="Get started by creating an account"
                      >
                        <span>Get Started</span>
                        <ArrowRight className="w-5 h-5" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <Link
                        href="/login"
                        aria-label="Sign in to existing account"
                      >
                        Sign In
                      </Link>
                    </Button>
                  </>
                ) : user.role === "ADMIN" ? (
                  <Button size="lg" asChild>
                    <Link
                      href="/dashboard"
                      prefetch={false}
                      className="flex items-center space-x-2"
                      aria-label="Go to admin dashboard"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" asChild>
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2"
                      aria-label="Go to your profile"
                    >
                      <span>Go to Profile</span>
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 id="features-heading" className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
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
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                  role="article"
                  aria-labelledby={`feature-${index}-title`}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 id={`feature-${index}-title`} className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 id="cta-heading" className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-blue-100 mb-8">Join thousands of users who trust our authentication system</p>

              {!user && (
                <Button size="lg" variant="secondary" asChild>
                  <Link
                    href="/register"
                    className="inline-flex items-center space-x-2"
                    aria-label="Create your account now"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8" role="contentinfo">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold">AuthApp</span>
            </div>
            <p className="text-gray-400">
              © {new Date().getFullYear()} AuthApp. Built with Next.js and TypeScript.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
