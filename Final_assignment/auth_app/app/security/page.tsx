"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedLayout from "@/components/ProtectedLayout"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, Activity, Search, Eye, Clock, User, Globe, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useSecurity } from "@/hooks/use-security"
import { useDebounce } from "@/hooks/use-debounce"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import type { SecurityEvent } from "@/lib/types"

// Event types configuration
const EVENT_TYPES = {
  FAILED_LOGIN: {
    label: "Failed Login",
    color: "text-red-600 bg-red-50 border-red-200",
    description: "Failed login attempt"
  },
  SUCCESSFUL_LOGIN: {
    label: "Successful Login", 
    color: "text-green-600 bg-green-50 border-green-200",
    description: "Successful login"
  },
  ACCOUNT_LOCKED: {
    label: "Account Locked",
    color: "text-orange-600 bg-orange-50 border-orange-200", 
    description: "Account locked due to security"
  },
  PASSWORD_RESET_REQUESTED: {
    label: "Password Reset",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    description: "Password reset requested"
  },
  PROFILE_UPDATED: {
    label: "Profile Updated",
    color: "text-purple-600 bg-purple-50 border-purple-200",
    description: "User profile updated"
  },
  OAUTH_LOGIN: {
    label: "OAuth Login",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    description: "OAuth authentication"
  }
} as const

// Date formatter with locale support
const formatDate = (timestamp: string | Date) => {
  try {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat(navigator.language || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  } catch {
    return 'Invalid Date'
  }
}

// Error Boundary Component
class SecurityErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ProtectedLayout>
          <div className="p-8">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4">
                An error occurred while loading the security dashboard.
              </p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </ProtectedLayout>
      )
    }

    return this.props.children
  }
}

function SecurityPageContent() {
  const { user } = useAuth()
  const { stats, loading, error, refetch } = useSecurity()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 300)
  const isInitialLoad = useRef(true)

  useEffect(() => {
    const toastId = "fetch-security"
    if (loading) {
      if (isInitialLoad.current) {
        toast.loading("Loading security data...", { id: toastId })
      }
    } else {
      toast.dismiss(toastId)
      if (error) {
        toast.error(error, { id: toastId })
      } else if (stats && isInitialLoad.current) {
        toast.success("Security data loaded!", { id: toastId })
        isInitialLoad.current = false
      }
    }
  }, [loading, error, stats])

  // Stable refetch function
  const stableRefetch = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  // Auto-refresh with cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      stableRefetch()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [stableRefetch])

  // Optimized filtering with memoization
  const filteredEvents = useMemo(() => {
    if (!stats?.recentEvents) return []
    
    return stats.recentEvents.filter((event: SecurityEvent) => {
      // Pre-computed searchable string for better performance
      const searchableText = [
        event.event,
        event.user?.email,
        event.ipAddress,
        event.userAgent,
        EVENT_TYPES[event.event as keyof typeof EVENT_TYPES]?.label
      ].filter(Boolean).join(' ').toLowerCase()
      
      const matchesSearch = !debouncedSearch || searchableText.includes(debouncedSearch.toLowerCase())
      const matchesFilter = filterType === "all" || event.event === filterType
      return matchesSearch && matchesFilter
    })
  }, [stats?.recentEvents, debouncedSearch, filterType])

  // Get event configuration
  const getEventConfig = useCallback((eventType: string) => {
    return EVENT_TYPES[eventType as keyof typeof EVENT_TYPES] || {
      label: eventType.replace(/_/g, " "),
      color: "text-gray-600 bg-gray-50 border-gray-200",
      description: "Unknown event type"
    }
  }, [])

  if (user?.role !== "ADMIN") {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need administrator privileges to access this page.</p>
            <Badge variant="destructive">Admin Access Required</Badge>
          </div>
        </div>
      </ProtectedLayout>
    )
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
        <div className="p-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={stableRefetch} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
              <p className="text-muted-foreground">Monitor security events and system activity</p>
            </div>
            <Button 
              onClick={stableRefetch} 
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
                <p className="text-xs text-muted-foreground">All security events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.suspiciousActivity || 0}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Types</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats?.eventTypes || {}).length}</div>
                <p className="text-xs text-muted-foreground">Different event types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recentEvents.length || 0}</div>
                <p className="text-xs text-muted-foreground">Last 20 events</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Event Types Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Event Types Distribution</CardTitle>
              <CardDescription>Breakdown of security events by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(stats?.eventTypes || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{type.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground">Events</p>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Events */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Latest security events and activities</CardDescription>

              {/* Search and Filter */}
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
                  <Input
                    id="event-search"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    aria-label="Search security events"
                  />
                  <label htmlFor="event-search" className="sr-only">
                    Search security events
                  </label>
                </div>
                <div className="min-w-[200px]">
                  <label htmlFor="event-filter" className="sr-only">
                    Filter events by type
                  </label>
                  <select
                    id="event-filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Filter events by type"
                  >
                    <option value="all">All Events</option>
                    {Object.entries(EVENT_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="space-y-4"
                aria-live="polite"
                aria-label="Security events list"
              >
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                    <p className="text-gray-500">No events found matching your criteria</p>
                  </div>
                ) : (
                  filteredEvents.map((event: SecurityEvent, index: number) => {
                    const eventConfig = getEventConfig(event.event)
                    return (
                      <div
                        key={`${event.id || index}-${event.timestamp}`}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                        role="article"
                        aria-labelledby={`event-${index}-title`}
                      >
                        <div className="flex items-center space-x-4">
                          <Badge 
                            className={`${eventConfig.color} border`}
                            aria-label={`${eventConfig.description} event`}
                          >
                            {eventConfig.label}
                          </Badge>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap">
                              {event.user && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                  <span className="text-sm font-medium">
                                    {event.user.email}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Globe className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                <span className="text-sm text-gray-600">{event.ipAddress}</span>
                              </div>
                            </div>
                            {event.userAgent && (
                              <p className="text-xs text-gray-500 mt-1 max-w-md truncate">
                                {event.userAgent.length > 80 
                                  ? `${event.userAgent.substring(0, 80)}...` 
                                  : event.userAgent
                                }
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {event.timestamp ? formatDate(event.timestamp) : "Unknown time"}
                          </p>
                          <Badge 
                            variant={event.success ? "default" : "destructive"}
                            aria-label={`Event ${event.success ? 'succeeded' : 'failed'}`}
                          >
                            {event.success ? "Success" : "Failed"}
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedLayout>
  )
}

// Main export with error boundary
export default function SecurityPage() {
  return (
    <SecurityErrorBoundary>
      <SecurityPageContent />
    </SecurityErrorBoundary>
  )
}
