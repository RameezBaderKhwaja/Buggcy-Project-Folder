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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit: SubmitHandler<ChangePasswordInput> = async (data) => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      console.log("Password change data:", data)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("Password changed successfully!")
      reset()
    } catch (error) {
      console.error("Failed to change password:", error)
      toast.error("Failed to change password. Please try again.")
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
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Choose a strong new password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  {loading ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
