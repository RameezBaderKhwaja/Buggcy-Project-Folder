"use client"

import React from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Shield, LogIn, UserPlus, User, Settings, BarChart3, Users, Calendar, Clock, Activity, Link as LinkIcon } from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()

  // If user is logged in, show personalized dashboard
  if (user) {
    const isAdmin = user.role === 'ADMIN'
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-full shadow-lg">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-blue-600" />
                )}
              </div>
            </div>
            
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Welcome back, {user.name || 'User'}!
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {isAdmin ? 'Admin Dashboard - Manage your application' : 'Your personal dashboard'}
            </p>
            <Badge variant={isAdmin ? "destructive" : "default"} className="text-sm">
              {user.role} Account
            </Badge>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {/* Profile Card */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer" onClick={() => router.push('/profile')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>My Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">Manage your personal information</p>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  {user.age && (
                    <div className="flex justify-between">
                      <span>Age:</span>
                      <span className="font-medium">{user.age} years</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span className="font-medium capitalize">{user.provider}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer" onClick={() => router.push('/settings')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Settings className="w-5 h-5 text-green-600" />
                  <span>Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">Customize your preferences</p>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Account Security</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Appearance</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin/User Specific Card */}
            {isAdmin ? (
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer" onClick={() => router.push('/dashboard')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span>Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">View detailed analytics and insights</p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>User Statistics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Growth Metrics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Security Logs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer" onClick={() => router.push('/users')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span>Community</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">Connect with other users</p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Browse Users</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>View Profiles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Network</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Account Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Member Since</p>
                    <p className="text-lg font-bold text-blue-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Account Type</p>
                    <p className="text-lg font-bold text-green-600">{user.role}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Provider</p>
                    <p className="text-lg font-bold text-purple-600 capitalize">{user.provider}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-lg font-bold text-orange-600">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity and Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <LogIn className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Successful login</p>
                      <p className="text-sm text-gray-500">
                        {new Date().toLocaleString()}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Profile updated</p>
                      <p className="text-sm text-gray-500">
                        {new Date(user.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LinkIcon className="w-5 h-5 text-blue-600" />
                  <span>Quick Links</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>
                    <Button variant="link" onClick={() => router.push('/profile')}>My Profile</Button>
                  </li>
                  <li>
                    <Button variant="link" onClick={() => router.push('/settings')}>Settings</Button>
                  </li>
                  {isAdmin && (
                    <li>
                      <Button variant="link" onClick={() => router.push('/dashboard')}>Dashboard</Button>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  // If user is not logged in, show original landing page
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
        <p>A project by RameezBadruddinKhwaja</p>
      </footer>
    </div>
  )
}
