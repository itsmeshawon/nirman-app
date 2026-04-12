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
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const shareholderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  unit_flat: z.string().min(1, "Unit/Flat is required"),
  ownership_pct: z.string().optional(),
  opening_balance: z.string().optional(),
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
  const [tempCredentials, setTempCredentials] = useState<{email: string, pass: string} | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShareholderFormValues>({
    resolver: zodResolver(shareholderSchema),
    defaultValues: {
      name: shareholder?.profiles?.name || "",
      email: shareholder?.profiles?.email || "",
      phone: shareholder?.profiles?.phone || "",
      unit_flat: shareholder?.unit_flat || "",
      ownership_pct: shareholder?.ownership_pct?.toString() || "",
      opening_balance: shareholder?.opening_balance?.toString() || "",
    },
  })

  // Reset form when opened with new data
  useEffect(() => {
    if (isOpen) {
        reset({
            name: shareholder?.profiles?.name || "",
            email: shareholder?.profiles?.email || "",
            phone: shareholder?.profiles?.phone || "",
            unit_flat: shareholder?.unit_flat || "",
            ownership_pct: shareholder?.ownership_pct?.toString() || "",
            opening_balance: shareholder?.opening_balance?.toString() || "",
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
      
      if (!isEdit && json.tempPassword) {
        setTempCredentials({ email: data.email, pass: json.tempPassword })
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
  }

  if (tempCredentials) {
    return (
      <Dialog open={true} onOpenChange={handleCloseCreds}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Temporary Credentials</DialogTitle>
            <DialogDescription>
              A new user has been created. Please share these temporary credentials. They will be prompted to change their password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temp-email" className="text-right">Email</Label>
              <Input id="temp-email" value={tempCredentials.email} readOnly className="col-span-3 font-mono" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temp-pass" className="text-right">Password</Label>
              <Input id="temp-pass" value={tempCredentials.pass} readOnly className="col-span-3 font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseCreds} className="bg-[#0F766E] hover:bg-teal-800">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
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

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#0F766E] hover:bg-teal-800">
              {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Add Shareholder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
