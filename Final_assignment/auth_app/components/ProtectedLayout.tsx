"use client"

import type React from "react"
import { useAuth } from "@/app/context/AuthContext"
import { LoadingSpinner } from "./LoadingSpinner"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/Sidebar"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2 px-4">
            <h1 className="text-lg font-semibold">AuthApp</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default ProtectedLayout
