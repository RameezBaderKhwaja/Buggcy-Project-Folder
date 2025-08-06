"use client"

import React, { useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedLayout from "@/components/ProtectedLayout"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { changePasswordSchema } from "@/lib/validators"
import type { ChangePasswordInput } from "@/lib/types"
import { Eye, EyeOff } from "lucide-react"

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { changePassword, setPassword, user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  // Determine user type and what action to show
  const isOAuthUser = user && user.provider !== 'local' && user.provider !== 'email'
  const hasPassword = user?.password !== null && user?.password !== undefined
  const shouldShowSetPassword = isOAuthUser && !hasPassword
  const shouldShowChangePassword = !isOAuthUser || hasPassword

  const onSubmit: SubmitHandler<ChangePasswordInput> = async (data) => {
    setLoading(true)
    try {
      let result
      
      if (shouldShowSetPassword) {
        // OAuth user setting password for first time
        result = await setPassword({
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword
        })
      } else {
        // Regular password change
        result = await changePassword(data)
      }
      
      if (result.success) {
        reset()
      } else {
        toast.error(result.error || "Failed to process request. Please try again.")
      }
    } catch (error) {
      console.error("Failed to process password request:", error)
      toast.error("Failed to process request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedLayout>
      <div className="p-8">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                {shouldShowSetPassword ? "Set Password" : "Change Password"}
              </CardTitle>
              <CardDescription>
                {shouldShowSetPassword 
                  ? "Set a password for your OAuth account to enable password login."
                  : "Choose a strong new password for your account."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shouldShowSetPassword && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    You're logged in with {user?.provider}. Setting a password will allow you to also login with email and password.
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {shouldShowChangePassword && (
                  <div className="space-y-2 relative">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      {...register("currentPassword")}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff /> : <Eye />}
                    </button>
                    {errors.currentPassword && (
                      <p className="text-sm text-red-500">{errors.currentPassword.message}</p>
                    )}
                  </div>
                )}
                <div className="space-y-2 relative">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    {...register("newPassword")}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff /> : <Eye />}
                  </button>
                  {errors.newPassword && (
                    <p className="text-sm text-red-500">{errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading 
                    ? (shouldShowSetPassword ? "Setting..." : "Changing...") 
                    : (shouldShowSetPassword ? "Set Password" : "Change Password")
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
