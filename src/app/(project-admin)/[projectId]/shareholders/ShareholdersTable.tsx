"use client"

import { useState, useEffect, useRef } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Crown, Mail, MapPin, Pencil, Phone, Search, ToggleLeft, ToggleRight, Trash2, UserPlus, Users } from "lucide-react"
import { ShareholderDialog } from "./ShareholdersForms"
import { toast } from "sonner"
import { mutate } from "swr"
import { EmptyState } from "@/components/EmptyState"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

interface ShareholdersTableProps {
  projectId: string
  data: any[]
  committeeShareholderIds?: string[]
}

export function ShareholdersTable({ projectId, data: initialData, committeeShareholderIds = [] }: ShareholdersTableProps) {
  const committeeSet = new Set(committeeShareholderIds)
  const [shareholders, setShareholders] = useState<any[]>(initialData)

  useEffect(() => {
    setShareholders(initialData)
  }, [initialData])
  const [sorting, setSorting] = useState<SortingState>([{ id: "unit_flat", desc: false }])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingShareholder, setEditingShareholder] = useState<any>(null)
  const [detailShareholder, setDetailShareholder] = useState<any>(null)
  const [visibleCount, setVisibleCount] = useState(15)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 15)
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleSaved = (saved: any) => {
    if (saved) {
      setShareholders(prev => {
        const exists = prev.some(s => s.id === saved.id)
        if (exists) return prev.map(s => s.id === saved.id ? { ...s, ...saved } : s)
        return [saved, ...prev]
      })
    } else {
      mutate(`/api/projects/${projectId}/page-data/shareholders`)
    }
  }

  const handleRemove = (id: string) => {
    setShareholders(prev => prev.filter(s => s.id !== id))
  }

  const handleStatusToggle = async (shareholder: any) => {
    const newStatus = shareholder.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    setShareholders(prev => prev.map(s => s.id === shareholder.id ? { ...s, status: newStatus } : s))
    try {
      const res = await fetch(`/api/projects/${projectId}/shareholders/${shareholder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success(`Status updated to ${newStatus}`)
      mutate(`/api/projects/${projectId}/page-data/shareholders`)
    } catch (err: any) {
      setShareholders(prev => prev.map(s => s.id === shareholder.id ? { ...s, status: shareholder.status } : s))
      toast.error(err.message)
    }
  }

  const handleDelete = async (shareholder: any) => {
    if (!confirm(`Are you sure you want to delete ${shareholder.profiles?.name}? This action cannot be undone.`)) return

    setShareholders(prev => prev.filter(s => s.id !== shareholder.id))
    try {
      const res = await fetch(`/api/projects/${projectId}/shareholders/${shareholder.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to delete shareholder")
      }
      toast.success("Shareholder deleted successfully")
      mutate(`/api/projects/${projectId}/page-data/shareholders`)
    } catch (err: any) {
      setShareholders(prev => [shareholder, ...prev])
      toast.error(err.message)
    }
  }

  const getProfile = (row: any) => {
    if (!row?.profiles) return null
    return Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorFn: (row) => getProfile(row)?.name,
      id: "name",
      header: "Name",
      cell: (info) => (
        <button
          type="button"
          onClick={() => setDetailShareholder(info.row.original)}
          className="flex items-center gap-1.5 font-medium text-on-surface hover:text-primary transition-colors text-left group"
        >
          {committeeSet.has(info.row.original.id) && (
            <span title="Committee Member">
              <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            </span>
          )}
          <span className="group-hover:underline underline-offset-2">{info.getValue() as string}</span>
        </button>
      ),
    },
    {
      accessorFn: (row) => getProfile(row)?.email,
      id: "email",
      header: "Email",
      cell: (info) => <div className="text-on-surface-variant">{info.getValue() as string}</div>,
    },
    {
      accessorFn: (row) => getProfile(row)?.phone,
      id: "phone",
      header: "Phone",
      cell: (info) => <div className="text-on-surface-variant">{info.getValue() as string || "—"}</div>,
    },
    {
      accessorKey: "unit_flat",
      header: "Unit/Flat",
      cell: (info) => <div className="font-medium">{info.getValue() as string}</div>,
    },
    {
      accessorKey: "ownership_pct",
      header: "Ownership",
      cell: (info) => {
        const val = info.getValue() as number
        return val ? <div className="text-on-surface-variant">{val}%</div> : "—"
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const isActive = status === "ACTIVE"
        return (
          <Badge className={isActive ? "bg-primary-container/50 text-on-primary-container hover:bg-primary-container/50" : "bg-surface-variant/50 text-on-surface hover:bg-surface-variant/50"}>
             {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const shareholder = row.original
        const isActive = shareholder.status === "ACTIVE"

        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-tertiary hover:text-tertiary hover:bg-tertiary-container/20"
              onClick={() => {
                setEditingShareholder(shareholder)
                setIsDialogOpen(true)
              }}
              title="Edit Shareholder"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isActive ? 'text-tertiary hover:text-on-tertiary-container hover:bg-tertiary-container/20' : 'text-primary hover:text-primary hover:bg-primary-container/20'}`}
              onClick={() => handleStatusToggle(shareholder)}
              title={isActive ? "Deactivate" : "Activate"}
            >
              {isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-error-container/20"
              onClick={() => handleDelete(shareholder)}
              title="Delete Shareholder"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: shareholders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className="space-y-0">
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 pt-4 pb-4 bg-background/95 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div />
          <Button
            onClick={() => {
              setEditingShareholder(null)
              setIsDialogOpen(true)
            }} 
            className="bg-primary hover:bg-primary"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Shareholder
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <Input
            placeholder="Search by name, email or unit..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-full border border-outline-variant/40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="pt-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.slice(0, visibleCount).map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-auto p-0 border-0">
                  <EmptyState
                    icon={Users}
                    title="No shareholders yet"
                    description="Add your first shareholder to start managing project unit owners."
                    actionLabel="Add Shareholder"
                    onAction={() => {
                      setEditingShareholder(null)
                      setIsDialogOpen(true)
                    }}
                    className="border-0 rounded-none"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Infinite Scroll Loader */}
        {table.getRowModel().rows.length > visibleCount && (
          <div ref={loaderRef} className="py-6 flex items-center justify-center border-t">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      <ShareholderDialog
        projectId={projectId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        shareholder={editingShareholder}
        onSaved={handleSaved}
        onRemove={handleRemove}
      />

      {/* Shareholder Detail Sheet */}
      <Sheet open={!!detailShareholder} onOpenChange={(open) => { if (!open) setDetailShareholder(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          {detailShareholder && (() => {
            const profile = getProfile(detailShareholder)
            const isCommittee = committeeSet.has(detailShareholder.id)
            const isActive = detailShareholder.status === "ACTIVE"
            const initials = profile?.name
              ? profile.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
              : "?"
            return (
              <>
                {/* Profile Header */}
                <div className="px-6 pt-8 pb-5 border-b border-outline-variant/40">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary-container/30 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-on-surface leading-tight">{profile?.name || "—"}</h2>
                        {isCommittee && (
                          <span title="Committee Member" className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            <Crown className="h-3 w-3" /> Committee
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-outline mt-0.5">Unit {detailShareholder.unit_flat || "—"}</p>
                      <span className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-primary-container/30 text-primary border border-primary-container" : "bg-surface-variant/50 text-on-surface-variant border border-outline-variant/40"}`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">
                  {/* Contact */}
                  <section>
                    <h3 className="text-xs font-semibold text-outline uppercase tracking-widest mb-3">Contact</h3>
                    <div className="space-y-3">
                      <DetailRow icon={<Mail className="h-4 w-4 text-outline" />} label="Email" value={profile?.email} />
                      <DetailRow icon={<Phone className="h-4 w-4 text-outline" />} label="Phone" value={profile?.phone} />
                      <DetailRow icon={<Phone className="h-4 w-4 text-outline" />} label="WhatsApp" value={profile?.whatsapp_no} />
                      <DetailRow icon={<MapPin className="h-4 w-4 text-outline" />} label="Present Address" value={profile?.present_address} />
                    </div>
                  </section>

                  <div className="border-t border-outline-variant/40" />

                  {/* Professional */}
                  <section>
                    <h3 className="text-xs font-semibold text-outline uppercase tracking-widest mb-3">Professional</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <StatField label="Profession" value={profile?.profession} />
                      <StatField label="Designation" value={profile?.designation} />
                      <StatField label="Organization" value={profile?.organization} className="col-span-2" />
                    </div>
                  </section>

                  <div className="border-t border-outline-variant/40" />

                  {/* Shareholder Info */}
                  <section>
                    <h3 className="text-xs font-semibold text-outline uppercase tracking-widest mb-3">Shareholding</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <StatField label="Unit / Flat" value={detailShareholder.unit_flat} />
                      <StatField label="Ownership" value={detailShareholder.ownership_pct != null ? `${detailShareholder.ownership_pct}%` : undefined} />
                      <StatField label="Opening Balance" value={detailShareholder.opening_balance != null ? `৳${Number(detailShareholder.opening_balance).toLocaleString()}` : undefined} />
                      <StatField label="Status" value={detailShareholder.status} />
                    </div>
                  </section>

                  {/* Payment Model */}
                  {(() => {
                    const pm = detailShareholder.payment_model
                    const model = Array.isArray(pm) ? pm[0] : pm
                    if (!model || (!model.monthly_enabled && !model.milestone_based_enabled)) return null
                    return (
                      <>
                        <div className="border-t border-outline-variant/40" />
                        <section>
                          <h3 className="text-xs font-semibold text-outline uppercase tracking-widest mb-3">Payment Model</h3>
                          <div className="space-y-2">
                            {model.monthly_enabled && (
                              <div className="flex items-start gap-3 rounded-lg bg-primary-container/20 border border-primary-container/40 px-3 py-2.5">
                                <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-primary">Monthly Fixed Amount</p>
                                  <p className="text-sm text-on-surface font-medium">
                                    ৳{Number(model.monthly_amount).toLocaleString()} &mdash; due on day {model.monthly_due_day} of each month
                                  </p>
                                </div>
                              </div>
                            )}
                            {model.milestone_based_enabled && (
                              <div className="flex items-start gap-3 rounded-lg bg-tertiary-container/20 border border-tertiary-container/40 px-3 py-2.5">
                                <Calendar className="h-4 w-4 text-tertiary mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-tertiary">Milestone Based</p>
                                  <p className="text-sm text-on-surface font-medium">
                                    {model.milestone_amount
                                      ? `৳${Number(model.milestone_amount).toLocaleString()} per milestone`
                                      : "Amount set per milestone"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      </>
                    )
                  })()}

                  <div className="border-t border-outline-variant/40" />

                  {/* Quick actions */}
                  <div className="flex gap-2 pb-2">
                    <button
                      onClick={() => { setEditingShareholder(detailShareholder); setIsDialogOpen(true); setDetailShareholder(null) }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary text-white text-sm font-medium transition-colors"
                    >
                      <Pencil className="h-4 w-4" /> Edit Profile
                    </button>
                    <button
                      onClick={() => { setDetailShareholder(null); handleStatusToggle(detailShareholder) }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${isActive ? "border-amber-200 text-on-tertiary-container hover:bg-tertiary-container/20" : "border-green-200 text-primary hover:bg-primary-container/20"}`}
                    >
                      {isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-outline">{label}</p>
        <p className="text-sm text-on-surface font-medium break-words">{value}</p>
      </div>
    </div>
  )
}

function StatField({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  if (!value) return null
  return (
    <div className={className}>
      <p className="text-xs text-outline uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-on-surface">{value}</p>
    </div>
  )
}
