"use client"

import { useEffect, useState, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table"
import { Search, Building2, ArrowUpDown, Key, Trash2, ShieldAlert, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { cn, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

interface ProjectAdmin {
  id: string
  name: string
  email: string
  phone: string | null
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  assignedProjects: string[]
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<ProjectAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])

  // Dialog states
  const [pwdDialog, setPwdDialog] = useState<{ open: boolean; adminId: string; adminName: string }>({
    open: false,
    adminId: "",
    adminName: "",
  })
  const [newPassword, setNewPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/admins")
      if (!res.ok) throw new Error("Failed to fetch admins")
      const data = await res.json()
      setAdmins(data)
    } catch {
      toast.error("Failed to load admins")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  async function handleToggleStatus(admin: ProjectAdmin) {
    const newStatus = admin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      const res = await fetch(`/api/super-admin/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success(`User set to ${newStatus}`)
      fetchAdmins()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDeleteAdmin(admin: ProjectAdmin) {
    if (!confirm(`Are you sure you want to delete ${admin.name}? This will permanently remove their account.`)) return
    try {
      const res = await fetch(`/api/super-admin/admins/${admin.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete user")
      toast.success("Adiministrator deleted successfully")
      fetchAdmins()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleResetPassword() {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/super-admin/admins/${pwdDialog.adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      if (!res.ok) throw new Error("Failed to reset password")
      toast.success("Password updated successfully")
      setPwdDialog({ open: false, adminId: "", adminName: "" })
      setNewPassword("")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const columns: ColumnDef<ProjectAdmin>[] = [
    {
      accessorKey: "name",
      header: "Administrator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.original.name}</span>
          <span className="text-xs text-gray-500">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.status === "ACTIVE"
        return (
          <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            isActive ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
          )}>
            {isActive ? "Active" : "Inactive"}
          </span>
        )
      },
    },
    {
      accessorKey: "assignedProjects",
      header: "Assigned Projects",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[250px]">
          {row.original.assignedProjects.length > 0 ? (
            row.original.assignedProjects.map(p => (
              <span key={p} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                {p}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">None</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => setPwdDialog({ open: true, adminId: row.original.id, adminName: row.original.name })}
            title="Reset Password"
          >
            <Key className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 transition-colors",
              row.original.status === "ACTIVE" ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"
            )}
            onClick={() => handleToggleStatus(row.original)}
            title={row.original.status === "ACTIVE" ? "Deactivate User" : "Activate User"}
          >
            {row.original.status === "ACTIVE" ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDeleteAdmin(row.original)}
            title="Delete Account"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: admins,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Administrators</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage accounts and platform access for admins</p>
        </div>
      </div>

      <Card className="bg-white shadow-sm border border-gray-100 uppercase-headers">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search admins..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="bg-gray-50/50">
                      {hg.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-10 text-gray-400">
                        No administrators found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={pwdDialog.open} onOpenChange={(open) => !isUpdating && setPwdDialog(p => ({ ...p, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Reset Admin Password
            </DialogTitle>
            <DialogDescription>
              Enter a new secure password for <strong>{pwdDialog.adminName}</strong>. 
              The user will need this new password to log in.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
             <Input
               type="password"
               placeholder="New secure password"
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
               className="h-10"
               autoFocus
             />
             <p className="text-[10px] text-gray-400 mt-2 italic">Minimum 6 characters recommended.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdDialog({ open: false, adminId: "", adminName: "" })} disabled={isUpdating}>
              Cancel
            </Button>
            <Button 
                onClick={handleResetPassword} 
                disabled={isUpdating || !newPassword}
                className="bg-[#0F766E] hover:bg-teal-800 text-white"
            >
              {isUpdating ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
