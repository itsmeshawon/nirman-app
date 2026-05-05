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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Copy, Check } from "lucide-react"

const shareholderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  unit_flat: z.string().optional(),
  ownership_pct: z.string().optional(),
  opening_balance: z.string().optional(),
  profession: z.string().optional(),
  designation: z.string().optional(),
  organization: z.string().optional(),
  present_address: z.string().optional(),
  whatsapp_no: z.string().optional(),
})

type ShareholderFormValues = z.infer<typeof shareholderSchema>

interface PaymentModel {
  monthly_enabled: boolean
  monthly_amount: string
  monthly_due_day: string
  milestone_based_enabled: boolean
  milestone_amount: string
}

interface Props {
  projectId: string
  isOpen: boolean
  onClose: () => void
  shareholder?: any
  onSaved?: (shareholder: any) => void
  onRemove?: (tempId: string) => void
}

export function ShareholderDialog({ projectId, isOpen, onClose, shareholder, onSaved, onRemove }: Props) {
  const isEdit = !!shareholder
  const [isLoading, setIsLoading] = useState(false)
  const [tempCredentials, setTempCredentials] = useState<{email: string, pass: string, name: string} | null>(null)
  const [copied, setCopied] = useState(false)

  const [paymentModel, setPaymentModel] = useState<PaymentModel>({
    monthly_enabled: false,
    monthly_amount: "",
    monthly_due_day: "",
    milestone_based_enabled: false,
    milestone_amount: "",
  })

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

      const pm = shareholder?.payment_model
      setPaymentModel({
        monthly_enabled: pm?.monthly_enabled ?? false,
        monthly_amount: pm?.monthly_amount?.toString() ?? "",
        monthly_due_day: pm?.monthly_due_day?.toString() ?? "",
        milestone_based_enabled: pm?.milestone_based_enabled ?? false,
        milestone_amount: pm?.milestone_amount?.toString() ?? "",
      })
    }
  }, [isOpen, shareholder, reset])

  const buildPaymentModelPayload = () => {
    if (!paymentModel.monthly_enabled && !paymentModel.milestone_based_enabled) return null
    return {
      monthly_enabled: paymentModel.monthly_enabled,
      monthly_amount: paymentModel.monthly_enabled && paymentModel.monthly_amount ? parseFloat(paymentModel.monthly_amount) : null,
      monthly_due_day: paymentModel.monthly_enabled && paymentModel.monthly_due_day ? parseInt(paymentModel.monthly_due_day) : null,
      milestone_based_enabled: paymentModel.milestone_based_enabled,
      milestone_amount: paymentModel.milestone_based_enabled && paymentModel.milestone_amount ? parseFloat(paymentModel.milestone_amount) : null,
    }
  }

  const onSubmit = async (data: ShareholderFormValues) => {
    if (!isEdit && !paymentModel.monthly_enabled && !paymentModel.milestone_based_enabled) {
      toast.error("Please select at least one Payment Model option")
      return
    }

    if (paymentModel.monthly_enabled) {
      if (!paymentModel.monthly_amount || parseFloat(paymentModel.monthly_amount) <= 0) {
        toast.error("Monthly amount is required when Monthly Fixed Amount is enabled")
        return
      }
      if (!paymentModel.monthly_due_day || parseInt(paymentModel.monthly_due_day) < 1 || parseInt(paymentModel.monthly_due_day) > 28) {
        toast.error("Due day must be between 1 and 28")
        return
      }
    }

    const payload = { ...data, payment_model: buildPaymentModelPayload() }

    if (isEdit && shareholder) {
      setIsLoading(true)
      const profile = Array.isArray(shareholder.profiles) ? shareholder.profiles[0] : shareholder.profiles
      const updatedShareholder = {
        ...shareholder,
        unit_flat: data.unit_flat,
        ownership_pct: data.ownership_pct ? parseFloat(data.ownership_pct) : shareholder.ownership_pct,
        opening_balance: data.opening_balance ? parseFloat(data.opening_balance) : shareholder.opening_balance,
        profiles: { ...profile, name: data.name, phone: data.phone, profession: data.profession, designation: data.designation, organization: data.organization, present_address: data.present_address, whatsapp_no: data.whatsapp_no },
        payment_model: buildPaymentModelPayload(),
      }
      onSaved?.(updatedShareholder)
      onClose()
      try {
        const res = await fetch(`/api/projects/${projectId}/shareholders/${shareholder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Something went wrong")
        toast.success("Shareholder updated successfully!")
      } catch (err: any) {
        toast.error(err.message)
        onSaved?.(shareholder)
      } finally {
        setIsLoading(false)
      }
      return
    }

    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId,
      unit_flat: data.unit_flat,
      ownership_pct: data.ownership_pct ? parseFloat(data.ownership_pct) : null,
      opening_balance: data.opening_balance ? parseFloat(data.opening_balance) : null,
      status: "ACTIVE",
      project_id: projectId,
      profiles: { name: data.name, email: data.email, phone: data.phone || null, profession: data.profession || null, designation: data.designation || null, organization: data.organization || null, present_address: data.present_address || null, whatsapp_no: data.whatsapp_no || null },
      payment_model: buildPaymentModelPayload(),
    }
    onSaved?.(optimistic)
    setTempCredentials({ email: data.email, pass: data.password || "test1234", name: data.name })

    ;(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/shareholders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Something went wrong")
        toast.success("Shareholder added successfully!")
        onSaved?.(null)
      } catch (err: any) {
        onRemove?.(tempId)
        toast.error(err.message)
      }
    })()
  }

  const handleCloseCreds = () => {
    setTempCredentials(null)
    onSaved?.(null)
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
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" {...register("phone")} disabled={isLoading} />
              {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit_flat">Unit/Flat</Label>
              <Input id="unit_flat" placeholder="e.g. 3A (optional)" {...register("unit_flat")} disabled={isLoading} />
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

          {/* Payment Model Section */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Payment Model *</p>
            <p className="text-xs text-outline mb-4">Select how this shareholder will make payments. At least one option must be chosen before generating a schedule.</p>

            <div className="space-y-4">
              {/* Monthly Fixed Amount */}
              <div className="rounded-lg border border-outline-variant/40 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="monthly_enabled"
                    checked={paymentModel.monthly_enabled}
                    onCheckedChange={(checked) =>
                      setPaymentModel(prev => ({ ...prev, monthly_enabled: !!checked }))
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="monthly_enabled" className="text-sm font-medium cursor-pointer">
                    Monthly Fixed Amount
                  </Label>
                </div>

                {paymentModel.monthly_enabled && (
                  <div className="grid grid-cols-2 gap-3 pl-7">
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-on-surface-variant">Monthly Amount (৳) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 50000"
                        value={paymentModel.monthly_amount}
                        onChange={(e) => setPaymentModel(prev => ({ ...prev, monthly_amount: e.target.value }))}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-on-surface-variant">Due Day of Month *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="28"
                        placeholder="e.g. 10"
                        value={paymentModel.monthly_due_day}
                        onChange={(e) => setPaymentModel(prev => ({ ...prev, monthly_due_day: e.target.value }))}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-outline">Day 1–28</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Milestone Based */}
              <div className="rounded-lg border border-outline-variant/40 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="milestone_based_enabled"
                    checked={paymentModel.milestone_based_enabled}
                    onCheckedChange={(checked) =>
                      setPaymentModel(prev => ({ ...prev, milestone_based_enabled: !!checked }))
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="milestone_based_enabled" className="text-sm font-medium cursor-pointer">
                    Milestone Based
                  </Label>
                </div>

                {paymentModel.milestone_based_enabled && (
                  <div className="pl-7">
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-on-surface-variant">Amount per Milestone (৳)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Optional — leave blank to set per milestone"
                        value={paymentModel.milestone_amount}
                        onChange={(e) => setPaymentModel(prev => ({ ...prev, milestone_amount: e.target.value }))}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-outline">If set, this amount is used when generating milestone-linked items.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
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
