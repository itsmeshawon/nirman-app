"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type PasswordFormValues = z.infer<typeof passwordSchema>

export function ManagePassword() {
  const [isSaving, setIsSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: PasswordFormValues) => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update password")

      toast.success("Password updated successfully")
      reset()
      setShowCurrent(false)
      setShowNew(false)
      setShowConfirm(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-surface rounded-[1.25rem] border border-outline-variant/40 overflow-hidden">
      <div className="px-8 md:px-12 pt-8 pb-4">
        <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
          <Lock className="w-4 h-4 text-outline" />
          Manage Password
        </h3>
        <p className="text-xs text-on-surface-variant mt-1">Update your account password. You must provide your current password to set a new one.</p>
      </div>

      <div className="px-8 md:px-12 pb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-on-surface">Current Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-outline" />
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                {...register("currentPassword")}
                className="pl-9 pr-10 h-11 rounded-xl"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-3 text-outline hover:text-on-surface-variant transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-on-surface">New Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-outline" />
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                {...register("newPassword")}
                className="pl-9 pr-10 h-11 rounded-xl"
                placeholder="Enter new password (min 8 characters)"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-outline hover:text-on-surface-variant transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-on-surface">Confirm New Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-outline" />
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                {...register("confirmPassword")}
                className="pl-9 pr-10 h-11 rounded-xl"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-outline hover:text-on-surface-variant transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="min-w-[160px] h-11 font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
