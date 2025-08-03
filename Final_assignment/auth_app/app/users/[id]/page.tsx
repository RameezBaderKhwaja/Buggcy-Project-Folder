"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Head from "next/head"
import Image from "next/image"
import ProtectedLayout from "@/components/ProtectedLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  AlertTriangle, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from "lucide-react"
import type { AuthUser } from "@/lib/types"
import { formatDate, capitalizeFirst } from "@/lib/utils"
import { toast } from "sonner"

// Enhanced profile completion checker
const isProfileComplete = (user: AuthUser): { isComplete: boolean; completionPercentage: number; missingFields: string[] } => {
  const requiredFields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'image', label: 'Profile Image' }
  ]
  
  const completedFields = requiredFields.filter(field => {
    const value = user[field.key as keyof AuthUser]
    return value !== null && value !== undefined && value !== ''
  })
  
  const missingFields = requiredFields
    .filter(field => {
      const value = user[field.key as keyof AuthUser]
      return value === null || value === undefined || value === ''
    })
    .map(field => field.label)
  
  const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100)
  const isComplete = completedFields.length === requiredFields.length
  
  return { isComplete, completionPercentage, missingFields }
}

// Loading skeleton component
const UserDetailSkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-64" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
    
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
)

// Enhanced error component
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onGoBack, 
  isRetrying = false 
}: { 
  error: string
  onRetry: () => void
  onGoBack: () => void
  isRetrying?: boolean
}) => (
  <div className="text-center py-12">
    <div className="max-w-md mx-auto">
      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {error === "User not found" ? "User Not Found" : "Something Went Wrong"}
      </h2>
      <p className="text-gray-600 mb-6">
        {error === "User not found" 
          ? "The user you're looking for doesn't exist or has been removed."
          : error
        }
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={onRetry} 
          disabled={isRetrying}
          variant="default"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </>
          )}
        </Button>
        <Button onClick={onGoBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
      </div>
    </div>
  </div>
)


export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isRetrying, setIsRetrying] = useState(false)

  // Enhanced fetch function with better error handling
  const fetchUser = useCallback(async (id: string, isRetry = false) => {
    if (isRetry) {
      setIsRetrying(true)
      setError("")
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUser(result.data)
          setError("")
          if (isRetry) {
            toast.success("User data loaded successfully!")
          }
        } else {
          setError(result.error || "Failed to load user")
          if (isRetry) {
            toast.error("Failed to load user data")
          }
        }
      } else if (response.status === 404) {
        setError("User not found")
        if (isRetry) {
          toast.error("User not found")
        }
      } else {
        const errorMessage = `Server error: ${response.status}`
        setError(errorMessage)
        if (isRetry) {
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      const errorMessage = "Network error. Please check your connection."
      setError(errorMessage)
      if (isRetry) {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchUser(params.id as string)
    }
  }, [params.id, fetchUser])

  // Retry handler
  const handleRetry = useCallback(() => {
    if (params.id) {
      fetchUser(params.id as string, true)
    }
  }, [params.id, fetchUser])

  // Go back handler
  const handleGoBack = useCallback(() => {
    router.push("/users")
  }, [router])

  // Loading state
  if (loading) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <UserDetailSkeleton />
        </div>
      </ProtectedLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <ErrorDisplay 
            error={error}
            onRetry={handleRetry}
            onGoBack={handleGoBack}
            isRetrying={isRetrying}
          />
        </div>
      </ProtectedLayout>
    )
  }

  // User not found (shouldn't happen with proper error handling, but kept for safety)
  if (!user) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <ErrorDisplay 
            error="User not found"
            onRetry={handleRetry}
            onGoBack={handleGoBack}
            isRetrying={isRetrying}
          />
        </div>
      </ProtectedLayout>
    )
  }

  // Calculate profile completion
  const profileCompletion = isProfileComplete(user)

  return (
    <>
      <Head>
        <title>{user.name ? `${user.name} - User Profile` : 'User Profile'}</title>
        <meta name="description" content={`Profile page for ${user.name || 'user'} - ${user.email}`} />
      </Head>
      
      <ProtectedLayout>
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <Button variant="ghost" onClick={handleGoBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-600">Detailed information about {user.name || 'this user'}</p>
          </div>

          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                {user.image ? (
                  <div className="relative">
                    <Image
                      src={user.image}
                      alt={user.name || "User profile"}
                      width={80}
                      height={80}
                      className="rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        // Fallback to placeholder on image error
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <div className="hidden w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                      {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-2xl">{user.name || "No name provided"}</CardTitle>
                  <p className="text-gray-600 text-lg flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {user.email}
                  </p>
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
                    <Badge 
                      variant={profileCompletion.isComplete ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {profileCompletion.completionPercentage}% Complete
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* User Details Grid */}
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
                {!profileCompletion.isComplete && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Missing Information</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profileCompletion.missingFields.map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
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
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-medium">{user.role}</p>
                    <Badge variant={user.role === "ADMIN" ? "destructive" : "secondary"}>
                      {user.role === "ADMIN" ? "Administrator" : "Standard User"}
                    </Badge>
                    </div>
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
                  <p className="text-lg font-medium flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Activity Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Account Age</p>
                  <p className="text-lg font-bold text-blue-600">
                    {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}{" "}
                    days
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  {profileCompletion.isComplete ? (
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  ) : (
                    <XCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  )}
                  <p className="text-sm font-medium text-gray-600">Account Status</p>
                  <p className={`text-lg font-bold ${profileCompletion.isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                    {profileCompletion.isComplete ? 'Complete' : 'Incomplete'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Profile Completion</p>
                  <p className="text-lg font-bold text-purple-600">
                    {profileCompletion.completionPercentage}%
                  </p>
                </div>
                
                <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <Shield className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Security Level</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {user.role === "ADMIN" ? "High" : "Standard"}
                  </p>
                </div>
              </div>
              
              {!profileCompletion.isComplete && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Profile Incomplete</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        This user's profile is missing some information. Missing fields: {profileCompletion.missingFields.join(', ')}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ProtectedLayout>
    </>
  )
}
