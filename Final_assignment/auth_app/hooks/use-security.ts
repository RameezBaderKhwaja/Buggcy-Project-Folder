"use client"

import { useState, useEffect } from "react"
import type { SecurityEvent } from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

interface SecurityStats {
  totalEvents: number
  recentEvents: SecurityEvent[]
  eventTypes: Record<string, number>
  suspiciousActivity: number
}

export function useSecurity() {
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const fetchSecurityStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/security/stats`, {
        credentials: "include",
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setStats(result.data)
        } else {
          setError(result.error || "Failed to fetch security stats")
        }
      } else {
        setError("Failed to fetch security stats")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const logSecurityEvent = async (event: {
    type: string
    details?: Record<string, unknown>
  }) => {
    try {
      await fetch(`${API_URL}/api/security/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
        credentials: "include",
      })
    } catch (err) {
      console.error("Failed to log security event:", err)
    }
  }

  useEffect(() => {
    fetchSecurityStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchSecurityStats,
    logEvent: logSecurityEvent,
  }
}
