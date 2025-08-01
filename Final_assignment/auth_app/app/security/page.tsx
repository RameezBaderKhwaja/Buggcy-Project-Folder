"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedLayout from "@/components/ProtectedLayout"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Shield, AlertTriangle, Activity, Search, Eye, Clock, User, Globe } from "lucide-react"
import { useSecurity } from "@/hooks/use-security"
import { useDebounce } from "@/hooks/use-debounce"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import type { SecurityEvent } from "@/lib/types"

export default function SecurityPage() {
  const { user } = useAuth()
  const { stats, loading, error, refetch } = useSecurity()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [refetch])

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
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  const filteredEvents =
    stats?.recentEvents?.filter((event: SecurityEvent) => {
      const matchesSearch =
        !debouncedSearch || JSON.stringify(event).toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesFilter = filterType === "all" || event.event === filterType
      return matchesSearch && matchesFilter
    }) || []

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "FAILED_LOGIN":
        return "text-red-600 bg-red-50"
      case "SUCCESSFUL_LOGIN":
        return "text-green-600 bg-green-50"
      case "ACCOUNT_LOCKED":
        return "text-orange-600 bg-orange-50"
      case "PASSWORD_RESET_REQUESTED":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">Monitor security events and system activity</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Events</option>
                  <option value="FAILED_LOGIN">Failed Logins</option>
                  <option value="SUCCESSFUL_LOGIN">Successful Logins</option>
                  <option value="ACCOUNT_LOCKED">Account Locked</option>
                  <option value="PASSWORD_RESET_REQUESTED">Password Resets</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No events found matching your criteria</p>
                  </div>
                ) : (
                  filteredEvents.map((event: SecurityEvent, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge className={getEventColor(event.event)}>
                          {event.event.replace(/_/g, " ")}
                        </Badge>
                        <div>
                          <div className="flex items-center space-x-2">
                            {event.user && (
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  {event.user.email}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Globe className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{event.ipAddress}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {event.userAgent && event.userAgent.substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ""}</p>
                        <Badge variant={event.success ? "default" : "destructive"}>
                          {event.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedLayout>
  )
}
