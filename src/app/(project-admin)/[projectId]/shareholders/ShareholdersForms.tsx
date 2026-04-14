/** @jsxImportSource react */
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Copy, Check } from "lucide-react"

const shareholderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  unit_flat: z.string().min(1, "Unit/Flat is required"),
  ownership_pct: z.string().optional(),
  opening_balance: z.string().optional(),
  profession: z.string().optional(),
  designation: z.string().optional(),
  organization: z.string().optional(),
  present_address: z.string().optional(),
  whatsapp_no: z.string().optional(),
})

type ShareholderFormValues = z.infer<typeof shareholderSchema>

interface Props {
  projectId: string
  isOpen: boolean
  onClose: () => void
  shareholder?: any // If provided, it's an edit
}

export function ShareholderDialog({ projectId, isOpen, onClose, shareholder }: Props) {
  const isEdit = !!shareholder
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [tempCredentials, setTempCredentials] = useState<{email: string, pass: string, name: string} | null>(null)
  const [copied, setCopied] = useState(false)

  const getProfile = (sh: any) => {
    if (!sh?.profiles) return null
    return Array.isArray(sh.profiles) ? sh.profiles[0] : sh.profiles
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShareholderFormValues>({
    resolver: zodResolver(shareholderSchema),
    defaultValues: {
      name: getProfile(shareholder)?.name || "",
      email: getProfile(shareholder)?.email || "",
      password: "test1234",
      phone: getProfile(shareholder)?.phone || "",
      unit_flat: shareholder?.unit_flat || "",
      ownership_pct: shareholder?.ownership_pct?.toString() || "",
      opening_balance: shareholder?.opening_balance?.toString() || "",
      profession: getProfile(shareholder)?.profession || "",
      designation: getProfile(shareholder)?.designation || "",
      organization: getProfile(shareholder)?.organization || "",
      present_address: getProfile(shareholder)?.present_address || "",
      whatsapp_no: getProfile(shareholder)?.whatsapp_no || "",
    },
  })

  // Reset form when opened with new data
  useEffect(() => {
    if (isOpen) {
        const profile = getProfile(shareholder)
        reset({
            name: profile?.name || "",
            email: profile?.email || "",
            password: "test1234",
            phone: profile?.phone || "",
            unit_flat: shareholder?.unit_flat || "",
            ownership_pct: shareholder?.ownership_pct?.toString() || "",
            opening_balance: shareholder?.opening_balance?.toString() || "",
            profession: profile?.profession || "",
            designation: profile?.designation || "",
            organization: profile?.organization || "",
            present_address: profile?.present_address || "",
            whatsapp_no: profile?.whatsapp_no || "",
        })
    }
  }, [isOpen, shareholder, reset])


  const onSubmit = async (data: ShareholderFormValues) => {
    setIsLoading(true)
    try {
      const url = isEdit
        ? `/api/projects/${projectId}/shareholders/${shareholder.id}`
        : `/api/projects/${projectId}/shareholders`
      
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Something went wrong")

      toast.success(`Shareholder ${isEdit ? "updated" : "added"} successfully!`)
      
      if (!isEdit && !shareholder) {
        setTempCredentials({ email: data.email, pass: data.password || "test1234", name: data.name })
      } else {
        onClose()
      }
      
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseCreds = () => {
    setTempCredentials(null)
    onClose()
    setCopied(false)
  }

  async function copyCredentials() {
    if (!tempCredentials) return
    const text = `NirmaN Login Credentials\nEmail: ${tempCredentials.email}\nPassword: ${tempCredentials.pass}\nURL: ${window.location.origin}/login`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (tempCredentials) {
    return (
      <Dialog open={true} onOpenChange={handleCloseCreds}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shareholder Created</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-on-surface-variant">
              Share these login credentials with <strong>{tempCredentials.name}</strong> for this project.
            </p>
            <div className="rounded-lg border border-outline-variant/40 bg-surface-variant/20 p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Email</span>
                <span className="text-on-surface">{tempCredentials.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Password</span>
                <span className="text-on-surface">{tempCredentials.pass}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">URL</span>
                <span className="text-on-surface text-xs">{typeof window !== "undefined" ? window.location.origin : ""}/login</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyCredentials}
              >
                {copied ? <Check className="h-4 w-4 text-primary mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                onClick={handleCloseCreds}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Shareholder" : "Add Shareholder"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Make changes to the shareholder's details."
              : "Add a new shareholder to this project. If they don't exist, we'll create an account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" {...register("name")} disabled={isLoading} />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register("email")} disabled={isLoading || isEdit} />
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>

          {!isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="text" {...register("password")} disabled={isLoading} />
              {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
              <p className="text-xs text-outline">Min 8 characters. Share this with the shareholder.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit_flat">Unit/Flat *</Label>
              <Input id="unit_flat" placeholder="e.g. 3A" {...register("unit_flat")} disabled={isLoading} />
              {errors.unit_flat && <span className="text-xs text-red-500">{errors.unit_flat.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
              <Label htmlFor="ownership_pct">Ownership (%)</Label>
              <Input id="ownership_pct" type="number" step="0.01" min="0" max="100" {...register("ownership_pct")} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="opening_balance">Opening Balance (৳)</Label>
              <Input id="opening_balance" type="number" step="0.01" placeholder="0" {...register("opening_balance")} disabled={isLoading} />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Additional Info (Optional)</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Input id="profession" {...register("profession")} disabled={isLoading} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" {...register("designation")} disabled={isLoading} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" {...register("organization")} disabled={isLoading} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp_no">WhatsApp No.</Label>
                  <Input id="whatsapp_no" {...register("whatsapp_no")} disabled={isLoading} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="present_address">Present Address</Label>
                <Textarea id="present_address" rows={2} {...register("present_address")} disabled={isLoading} />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary">
              {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Add Shareholder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
