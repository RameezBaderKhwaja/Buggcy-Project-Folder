// app/dashboard/page.tsx
"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedLayout from "@/components/ProtectedLayout"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, UserCheck, Calendar, TrendingUp, RefreshCw, AlertCircle } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import type { UserStats } from "@/lib/types"

// Chart configuration constants
const CHART_CONFIG = {
  COLORS: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"],
  BAR_COLOR: "#8884d8",
  LINE_COLOR: "#8884d8",
  STROKE_WIDTH: 2,
  OUTER_RADIUS: 80,
} as const

interface ChartDataPoint {
  name: string
  value: number
}

interface MonthlyDataPoint {
  month: string
  registrations: number
}

// Get user's locale for date formatting
const getUserLocale = (): string => {
  if (typeof window !== 'undefined' && navigator.language) {
    return navigator.language
  }
  return 'en-US'
}

export default function DashboardPage() {
  const { user, getDashboardStats } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retrying, setRetrying] = useState(false)
  
  // Ref to track component mount status
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    // Only fetch if user is admin
    if (user?.role === "ADMIN") {
      fetchStats()
    } else if (user && user.role === "USER") {
      setError("Access denied. Admin privileges required.")
      setLoading(false)
    }
    
    return () => {
      isMountedRef.current = false
    }
  }, [user])

  const fetchStats = useCallback(async () => {
    // Don't fetch if user is not admin
    if (!user || user.role !== "ADMIN") {
      setError("Access denied. Admin privileges required.")
      setLoading(false)
      return
    }

    try {
      setError("")
      if (!retrying) {
        setLoading(true)
      }

      const result = await getDashboardStats()

      if (!isMountedRef.current) return

      if (result.success && result.data) {
        console.log("Dashboard Stats:", result.data)
        setStats(result.data)
      } else {
        setError(result.error || "Failed to load dashboard data")
      }
    } catch (error) {
      if (!isMountedRef.current) return
      
      console.error("Failed to fetch stats:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setRetrying(false)
      }
    }
  }, [user, retrying, getDashboardStats])

  const handleRetry = useCallback(() => {
    setRetrying(true)
    fetchStats()
  }, [fetchStats])

  // Memoized chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    if (!stats) return null

    const locale = getUserLocale()
    
    const ageGroupData: ChartDataPoint[] = Object.entries(stats.ageGroups).map(([group, count]) => ({
      name: group,
      value: count,
    }))

    const genderData: ChartDataPoint[] = stats.genderStats.map((stat) => ({
      name: stat.gender.charAt(0).toUpperCase() + stat.gender.slice(1),
      value: stat.count,
    }))

    const monthlyData: MonthlyDataPoint[] = Object.entries(stats.monthlyRegistrations)
      .map(([month, count]) => ({
        month: new Intl.DateTimeFormat(locale, { 
          month: "short", 
          year: "2-digit" 
        }).format(new Date(month + "-01")),
        registrations: count,
      }))
      .slice(-12) // Last 12 months

    const maleCount = stats.genderStats.find((s) => s.gender === "male")?.count || 0
    const femaleCount = stats.genderStats.find((s) => s.gender === "female")?.count || 0
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonthRegistrations = stats.monthlyRegistrations[currentMonth] || 0

    return {
      ageGroupData,
      genderData,
      monthlyData,
      maleCount,
      femaleCount,
      thisMonthRegistrations,
    }
  }, [stats])

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <ProtectedLayout>
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Dashboard</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              {user?.role !== "ADMIN" && (
                <Badge variant="destructive" className="mb-4">Admin Access Required</Badge>
              )}
              <div>
                <Button 
                  onClick={handleRetry} 
                  disabled={retrying}
                  className="mr-2"
                >
                  {retrying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  if (!stats || !chartData) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <div className="text-center">
            <p className="text-gray-600">No data available</p>
            <Button onClick={handleRetry} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  const { ageGroupData, genderData, monthlyData, maleCount, femaleCount, thisMonthRegistrations } = chartData

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
              <p className="text-muted-foreground">Comprehensive overview of user statistics and trends</p>
            </div>
            <Button onClick={handleRetry} variant="outline" size="sm" disabled={retrying}>
              {retrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`Total users: ${stats.totalUsers}`}>
                  {stats.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  All registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font--medium">Male Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`Male users: ${maleCount}`}>
                  {maleCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalUsers > 0 ? Math.round((maleCount / stats.totalUsers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Female Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`Female users: ${femaleCount}`}>
                  {femaleCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalUsers > 0 ? Math.round((femaleCount / stats.totalUsers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`This month registrations: ${thisMonthRegistrations}`}>
                  {thisMonthRegistrations.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">New registrations</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Age Groups Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="col-span-full lg:col-span-4 min-h-[500px] flex flex-col distribution-card">
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>User distribution across age groups</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 flex-grow">
                <figure aria-label="Age distribution bar chart" className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageGroupData} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={CHART_CONFIG.BAR_COLOR} />
                    </BarChart>
                  </ResponsiveContainer>
                </figure>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gender Distribution Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="col-span-full lg:col-span-3 min-h-[500px] flex flex-col distribution-card">
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>User distribution by gender</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 flex-grow">
                <figure aria-label="Gender distribution pie chart" className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart accessibilityLayer>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={CHART_CONFIG.OUTER_RADIUS}
                        fill={CHART_CONFIG.BAR_COLOR}
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_CONFIG.COLORS[index % CHART_CONFIG.COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </figure>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Registration Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="col-span-full min-h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle>Registration Trend</CardTitle>
              <CardDescription>Monthly user registrations over time</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 flex-grow">
              <figure aria-label="Monthly registration trend line chart" className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="registrations" 
                      stroke={CHART_CONFIG.LINE_COLOR} 
                      strokeWidth={CHART_CONFIG.STROKE_WIDTH} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </figure>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedLayout>
  )
}
