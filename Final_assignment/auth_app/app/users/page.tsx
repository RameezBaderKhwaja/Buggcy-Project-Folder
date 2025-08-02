"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import ProtectedLayout from "@/components/ProtectedLayout"
import { UserCard } from "@/components/UserCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  Users, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Database
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import type { AuthUser } from "@/lib/types"

// Enhanced API URL handling
const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    console.warn("Missing NEXT_PUBLIC_API_URL environment variable. Defaulting to localhost.")
    return "http://localhost:3000"
  }
  return apiUrl
}

const API_URL = getApiUrl()

// Icon configuration for better maintainability
const ICONS = {
  users: Users,
  search: Search,
  filter: Filter,
  refresh: RefreshCw,
  alert: AlertTriangle,
  trending: TrendingUp,
  eye: Eye,
  database: Database
} as const

// Provider options configuration
const PROVIDER_OPTIONS = [
  { value: "all", label: "All Providers" },
  { value: "email", label: "Email" },
  { value: "google", label: "Google" },
  { value: "github", label: "GitHub" },
  { value: "oauth", label: "OAuth" }
] as const

// Loading skeleton component
const UserCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Enhanced loading component
const UsersLoadingSkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    <div className="flex flex-col sm:flex-row gap-4">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-40" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="w-8 h-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <UserCardSkeleton key={i} />
      ))}
    </div>
  </div>
)

// Enhanced error component
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  isRetrying = false 
}: { 
  error: string
  onRetry: () => void
  isRetrying?: boolean
}) => (
  <div className="text-center py-12">
    <div className="max-w-md mx-auto">
      <ICONS.alert className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Users</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <Button onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? (
          <>
            <ICONS.refresh className="w-4 h-4 mr-2 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <ICONS.refresh className="w-4 h-4 mr-2" />
            Try Again
          </>
        )}
      </Button>
    </div>
  </div>
)

// Enhanced empty state component
const EmptyState = ({ 
  searchTerm, 
  filterProvider 
}: { 
  searchTerm: string
  filterProvider: string
}) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="text-center py-12"
  >
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        <ICONS.eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      </motion.div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
      <p className="text-gray-600">
        {searchTerm || filterProvider !== "all"
          ? "Try adjusting your search or filter criteria"
          : "No users have been registered yet"}
      </p>
      {(searchTerm || filterProvider !== "all") && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {searchTerm && (
            <Badge variant="outline">
              Search: "{searchTerm}"
            </Badge>
          )}
          {filterProvider !== "all" && (
            <Badge variant="outline">
              Provider: {filterProvider}
            </Badge>
          )}
        </div>
      )}
    </div>
  </motion.div>
)

export default function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProvider, setFilterProvider] = useState("all")
  const [isRetrying, setIsRetrying] = useState(false)

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Enhanced fetch function with better error handling
  const fetchUsers = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setIsRetrying(true)
      setError("")
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUsers(result.data)
          setError("")
          if (isRetry) {
            toast.success("Users loaded successfully!")
          }
        } else {
          const errorMessage = result.error || "Failed to load users"
          setError(errorMessage)
          if (isRetry) {
            toast.error(errorMessage)
          }
        }
      } else {
        const errorMessage = `Server error: ${response.status} ${response.statusText}`
        setError(errorMessage)
        if (isRetry) {
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      const errorMessage = "Network error. Please check your connection and try again."
      setError(errorMessage)
      if (isRetry) {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }, [])

  // Optimized filtering with useMemo instead of separate state
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Filter by search term (using debounced value)
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    // Filter by provider
    if (filterProvider !== "all") {
      filtered = filtered.filter((user) => user.provider === filterProvider)
    }

    return filtered
  }, [users, debouncedSearchTerm, filterProvider])

  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Retry handler
  const handleRetry = useCallback(() => {
    fetchUsers(true)
  }, [fetchUsers])

  // Loading state with skeleton
  if (loading) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <UsersLoadingSkeleton />
        </div>
      </ProtectedLayout>
    )
  }

  // Error state with enhanced error display
  if (error) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <ErrorDisplay 
            error={error}
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="p-8 space-y-8">
        {/* Enhanced Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <ICONS.users className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              </div>
              <p className="text-gray-600">Manage and view all registered users</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {users.length} Total
              </Badge>
              {(searchTerm || filterProvider !== "all") && (
                <Badge variant="secondary" className="text-sm">
                  {filteredUsers.length} Filtered
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <ICONS.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Search users"
              />
            </div>
            <div className="flex items-center space-x-2 min-w-[200px]">
              <ICONS.filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter by provider"
              >
                {PROVIDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <ICONS.users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
                  </div>
                  <ICONS.filter className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Filter</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {filterProvider === "all" ? "None" : filterProvider}
                    </p>
                  </div>
                  <ICONS.search className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Search Active</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {searchTerm ? "Yes" : "No"}
                    </p>
                  </div>
                  <ICONS.trending className="w-8 h-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Enhanced Users Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {filteredUsers.length === 0 ? (
            <EmptyState 
              searchTerm={searchTerm}
              filterProvider={filterProvider}
            />
          ) : (
            <div className="space-y-4">
              {/* Results header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filteredUsers.length === users.length 
                    ? `All Users (${users.length})`
                    : `Filtered Results (${filteredUsers.length} of ${users.length})`
                  }
                </h2>
                {(searchTerm || filterProvider !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setFilterProvider("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
              
              {/* Users grid with staggered animation */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <UserCard user={user} index={index} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </ProtectedLayout>
  )
}
