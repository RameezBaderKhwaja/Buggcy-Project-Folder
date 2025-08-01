"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import ProtectedLayout from "@/components/ProtectedLayout"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Mail, Calendar, Shield } from "lucide-react"
import type { AuthUser } from "@/lib/types"
import { formatDate, capitalizeFirst } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchUser(params.id as string)
    }
  }, [params.id])

  const fetchUser = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        credentials: "include",
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUser(result.data)
        } else {
          setError(result.error || "Failed to load user")
        }
      } else if (response.status === 404) {
        setError("User not found")
      } else {
        setError("Failed to load user")
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setError("Failed to load user")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </ProtectedLayout>
    )
  }

  if (error) {
    return (
      <ProtectedLayout>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/users")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </ProtectedLayout>
    )
  }

  if (!user) {
    return (
      <ProtectedLayout>
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => router.push("/users")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">Detailed information about the user</p>
        </motion.div>

        {/* User Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                {user.image ? (
                  <img
                    src={user.image || "/placeholder.svg"}
                    alt={user.name || "User"}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-2xl">{user.name || "No name"}</CardTitle>
                  <p className="text-gray-600 text-lg">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={user.role === "ADMIN" ? "destructive" : "secondary"}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        user.provider === "github"
                          ? "border-gray-600 text-gray-600"
                          : user.provider === "google"
                            ? "border-red-600 text-red-600"
                            : "border-blue-600 text-blue-600"
                      }
                    >
                      {capitalizeFirst(user.provider)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* User Details Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-lg font-medium">{user.name || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                  <p className="text-lg font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {user.email}
                  </p>
                </div>
                {user.age && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Age</label>
                    <p className="text-lg font-medium">{user.age} years old</p>
                  </div>
                )}
                {user.gender && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-lg font-medium">{capitalizeFirst(user.gender)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Account Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Type</label>
                  <p className="text-lg font-medium">{user.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Authentication Provider</label>
                  <p className="text-lg font-medium">{capitalizeFirst(user.provider)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Member Since</label>
                  <p className="text-lg font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(user.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-lg font-medium">{formatDate(user.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Activity Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Account Age</p>
                  <p className="text-lg font-bold text-blue-600">
                    {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}{" "}
                    days
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Account Status</p>
                  <p className="text-lg font-bold text-green-600">Active</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Profile Completion</p>
                  <p className="text-lg font-bold text-purple-600">
                    {user.name && user.age && user.gender ? "Complete" : "Incomplete"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedLayout>
  )
}
