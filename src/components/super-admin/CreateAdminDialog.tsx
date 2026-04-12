"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { UserPlus, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type FormValues = z.infer<typeof schema>

interface SuccessData {
  name: string
  email: string
  password: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
}

export default function CreateAdminDialog({ open, onOpenChange, projectId, projectName }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "test1234" },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to create admin")
      }

      setSuccess({ name: values.name, email: values.email, password: values.password })
      toast.success("Project Admin created!")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    onOpenChange(false)
    setSuccess(null)
    reset()
    setCopied(false)
  }

  async function copyCredentials() {
    if (!success) return
    const text = `NirmaN Login Credentials\nEmail: ${success.email}\nPassword: ${success.password}\nURL: ${window.location.origin}/login`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {success ? "Admin Created" : "Assign Project Admin"}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          /* Success state — show credentials */
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Share these login credentials with <strong>{success.name}</strong> for the project{" "}
              <strong>{projectName}</strong>.
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900">{success.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Password</span>
                <span className="text-gray-900">{success.password}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">URL</span>
                <span className="text-gray-900 text-xs">{typeof window !== "undefined" ? window.location.origin : ""}/login</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyCredentials}
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button
                className="flex-1 bg-[#0F766E] hover:bg-[#14B8A6] text-white"
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <p className="text-sm text-gray-500">
              Creating admin for <strong className="text-gray-700">{projectName}</strong>
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Full Name <span className="text-red-500">*</span></Label>
              <Input id="admin-name" placeholder="e.g. Kamal Hossain" {...register("name")} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email <span className="text-red-500">*</span></Label>
              <Input id="admin-email" type="email" placeholder="kamal@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-phone">Phone</Label>
              <Input id="admin-phone" type="tel" placeholder="+880 17XX XXXXXX" {...register("phone")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input id="admin-password" type="text" {...register("password")} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              <p className="text-xs text-gray-400">Min 8 characters. Share this with the admin.</p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#0F766E] hover:bg-[#14B8A6] text-white"
              >
                <UserPlus className="h-4 w-4" />
                {loading ? "Creating..." : "Create Admin"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
