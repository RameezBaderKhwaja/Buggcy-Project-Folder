"use client"

import React, { useState, useEffect } from "react"
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
import { changePasswordSchema, setPasswordSchema } from "@/lib/validators"
import type { ChangePasswordInput, SetPasswordInput } from "@/lib/types"
import { Eye, EyeOff } from "lucide-react"

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { changePassword, setPassword, user, refreshUser } = useAuth()

  // Determine user type and what action to show
  // OAuth providers: 'github', 'google', etc.
  // Local providers: 'local', 'email'
  const isOAuthUser = user && !['local', 'email'].includes(user.provider)
  const hasPassword = user?.password !== null && user?.password !== undefined
  const shouldShowSetPassword = isOAuthUser && !hasPassword
  const shouldShowChangePassword = !isOAuthUser || hasPassword

  // Use different schemas based on the action
  const schema = shouldShowSetPassword ? setPasswordSchema : changePasswordSchema
  const formType = shouldShowSetPassword ? 'setPassword' : 'changePassword'

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput | SetPasswordInput>({
    resolver: zodResolver(schema),
  })

  const onSubmit: SubmitHandler<ChangePasswordInput | SetPasswordInput> = async (data) => {
    setLoading(true)
    try {
      let result
      
      if (shouldShowSetPassword) {
        // OAuth user setting password for first time
        const setPasswordData = data as SetPasswordInput
        result = await setPassword({
          newPassword: setPasswordData.newPassword,
          confirmPassword: setPasswordData.confirmPassword
        })
      } else {
        // Regular password change
        const changePasswordData = data as ChangePasswordInput
        result = await changePassword(changePasswordData)
      }
      
      if (result.success) {
        reset()
        toast.success(shouldShowSetPassword ? "Password set successfully!" : "Password changed successfully!")
        
        // Refresh user data to update password status
        await refreshUser()
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
                      {...register("currentPassword" as keyof (ChangePasswordInput | SetPasswordInput))}
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
