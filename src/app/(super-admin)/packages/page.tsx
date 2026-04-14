"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, ToggleLeft, ToggleRight, Package } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import PackageDialog from "@/components/super-admin/PackageDialog"

interface Package {
  id: string
  name: string
  description: string | null
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

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

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<any | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/packages")
      if (!res.ok) throw new Error("Failed to fetch packages")
      const data = await res.json()
      setPackages(data)
    } catch {
      toast.error("Failed to load packages")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  function handleSuccess(pkg: any) {
    fetchPackages()
    setCreateDialogOpen(false)
    setEditingPackage(null)
  }

  async function handleToggleStatus(pkg: Package) {
    if (togglingIds.has(pkg.id)) return
    const newStatus = !pkg.is_active

    // Optimistic update
    setTogglingIds((prev) => new Set(prev).add(pkg.id))
    setPackages((prev) =>
      prev.map((p) => (p.id === pkg.id ? { ...p, is_active: newStatus } : p))
    )

    try {
      const res = await fetch(`/api/packages/${pkg.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      })

      if (!res.ok) throw new Error("Failed to update status")

      toast.success(`Package ${newStatus ? "activated" : "deactivated"} successfully`)
    } catch {
      // Revert on error
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, is_active: !newStatus } : p))
      )
      toast.error("Failed to update package status")
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(pkg.id)
        return next
      })
    }
  }

  return (
    <>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Packages</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage feature packages for projects</p>
          </div>
          <Button
            onClick={() => {
              setEditingPackage(null)
              setCreateDialogOpen(true)
            }}
            className="bg-primary hover:bg-primary/90 text-white shrink-0 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Package</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        <Card className="shadow-none border-0 bg-transparent">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : packages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Package className="h-14 w-14 text-outline-variant mb-4" />
                <p className="text-lg font-semibold text-on-surface">No packages yet</p>
                <p className="text-sm text-outline mt-1 max-w-xs">
                  Create your first feature package to assign to projects.
                </p>
                <Button
                  className="mt-5 bg-primary hover:bg-primary/90 text-white"
                  onClick={() => {
                    setEditingPackage(null)
                    setCreateDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Package
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-variant/20/50">
                      <TableHead className="text-xs uppercase tracking-wide text-on-surface-variant">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-on-surface-variant">Features</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-on-surface-variant">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-on-surface-variant">Created</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wide text-on-surface-variant">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => {
                      const featureKeys = pkg.features ?? []
                      const visible = featureKeys.slice(0, 3)
                      const extra = featureKeys.length - 3

                      return (
                        <TableRow key={pkg.id} className="hover:bg-surface-variant/20">
                          <TableCell>
                            <p className="font-bold text-on-surface">{pkg.name}</p>
                            {pkg.description && (
                              <p className="text-xs text-outline mt-0.5 max-w-xs truncate">{pkg.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {visible.map((key) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center rounded-full bg-primary-container/20 border border-primary-container px-2 py-0.5 text-xs font-medium text-primary"
                                >
                                  {FEATURE_LABELS[key]?.label ?? key}
                                </span>
                              ))}
                              {extra > 0 && (
                                <span className="inline-flex items-center rounded-full bg-surface-variant/50 border border-outline-variant/40 px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                                  +{extra} more
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {pkg.is_active ? (
                              <span className="inline-flex items-center rounded-full bg-primary-container/20 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-primary">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-surface-variant/50 border border-outline-variant/40 px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-on-surface-variant">{formatDate(pkg.created_at)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-tertiary hover:text-tertiary hover:bg-tertiary-container/20"
                                onClick={() => {
                                  setEditingPackage(pkg)
                                  setCreateDialogOpen(true)
                                }}
                                title="Edit Package"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${pkg.is_active ? "text-primary hover:text-primary hover:bg-primary-container/20" : "text-amber-500 hover:text-tertiary hover:bg-tertiary-container/20"}`}
                                onClick={() => handleToggleStatus(pkg)}
                                disabled={togglingIds.has(pkg.id)}
                                title={pkg.is_active ? "Deactivate" : "Activate"}
                              >
                                {pkg.is_active
                                  ? <ToggleRight className="h-4 w-4" />
                                  : <ToggleLeft className="h-4 w-4" />
                                }
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PackageDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) setEditingPackage(null)
        }}
        onSuccess={handleSuccess}
        pkg={editingPackage ?? undefined}
      />
    </>
  )
}
