"use client"

import { useState, useEffect } from "react"
import { Check, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const FEATURE_LABELS: Record<string, { label: string; description: string }> = {
  expense_governance:    { label: "Expense Governance",       description: "Create, approve & publish expenses" },
  payment_management:    { label: "Payments & Schedules",     description: "Payment schedules, receipts & tracking" },
  penalty_engine:        { label: "Penalty Engine",           description: "Auto penalty calculation & waivers" },
  activity_feed:         { label: "Activity Feed",            description: "Construction updates with media" },
  document_library:      { label: "Document Library",         description: "Upload & manage project documents" },
  committee_approval:    { label: "Committee Approval",       description: "Multi-member expense approval workflow" },
  milestone_tracking:    { label: "Milestone Tracking",       description: "Project phases & target dates" },
  reports_exports:       { label: "Reports & Exports",        description: "PDF/CSV report generation" },
  notifications:         { label: "Notifications",            description: "In-app notification system" },
  shareholder_dashboard: { label: "Shareholder Dashboard",    description: "Shareholder portal & overview" },
}

const ALL_FEATURE_KEYS = Object.keys(FEATURE_LABELS)

interface PackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (pkg: any) => void
  pkg?: any // If provided, edit mode
}

export default function PackageDialog({ open, onOpenChange, onSuccess, pkg }: PackageDialogProps) {
  const isEdit = !!pkg
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [nameError, setNameError] = useState("")
  const [featuresError, setFeaturesError] = useState("")

  useEffect(() => {
    if (open) {
      if (pkg) {
        setName(pkg.name ?? "")
        setDescription(pkg.description ?? "")
        setSelectedFeatures(new Set(pkg.features ?? []))
      } else {
        setName("")
        setDescription("")
        setSelectedFeatures(new Set())
      }
      setNameError("")
      setFeaturesError("")
    }
  }, [pkg, open])

  function toggleFeature(key: string) {
    setSelectedFeatures((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    if (featuresError) setFeaturesError("")
  }

  async function handleSubmit() {
    // Inline validation
    let valid = true
    if (!name || name.trim().length < 2) {
      setNameError("Name must be at least 2 characters")
      valid = false
    } else {
      setNameError("")
    }
    if (selectedFeatures.size === 0) {
      setFeaturesError("Select at least one feature")
      valid = false
    } else {
      setFeaturesError("")
    }
    if (!valid) return

    setLoading(true)
    try {
      const url = isEdit ? `/api/packages/${pkg.id}` : "/api/packages"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          features: Array.from(selectedFeatures),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message ?? `Failed to ${isEdit ? "update" : "create"} package`)
      }

      const result = await res.json()
      toast.success(`Package ${isEdit ? "updated" : "created"} successfully!`)
      onSuccess(result)
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Package" : "Create Package"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="pkg-name">
              Package Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pkg-name"
              placeholder="e.g. Standard Plan"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError("")
              }}
            />
            {nameError && <p className="text-xs text-red-600">{nameError}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="pkg-description">Description</Label>
            <Textarea
              id="pkg-description"
              placeholder="Brief description of this package..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Features */}
          <div className="space-y-2">
            <div>
              <Label>Features <span className="text-red-500">*</span></Label>
              <p className="text-xs text-gray-500">Select the platform features included in this package.</p>
            </div>

            {featuresError && <p className="text-xs text-red-600">{featuresError}</p>}

            <div className="grid grid-cols-2 gap-2">
              {ALL_FEATURE_KEYS.map((key) => (
                <div
                  key={key}
                  onClick={() => toggleFeature(key)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedFeatures.has(key)
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    selectedFeatures.has(key) ? "border-teal-600 bg-teal-600" : "border-gray-300"
                  }`}>
                    {selectedFeatures.has(key) && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{FEATURE_LABELS[key].label}</p>
                    <p className="text-xs text-gray-500">{FEATURE_LABELS[key].description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#0F766E] hover:bg-[#14B8A6] text-white"
          >
            {!isEdit && <Plus className="h-4 w-4" />}
            {loading
              ? isEdit ? "Saving..." : "Creating..."
              : isEdit ? "Save Changes" : "Create Package"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
