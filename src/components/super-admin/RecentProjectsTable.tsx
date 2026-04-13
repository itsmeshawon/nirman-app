"use client"

import { useState, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table"
import {
  ArrowUpDown, Building2, UserPlus, Pencil,
  ToggleLeft, ToggleRight, Archive,
} from "lucide-react"
import { toast } from "sonner"
import { cn, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ProjectDialog from "@/components/super-admin/CreateProjectDialog"
import CreateAdminDialog from "@/components/super-admin/CreateAdminDialog"

export interface ProjectRow {
  id: string
  name: string
  address: string | null
  area: string | null
  status: string
  start_date: string | null
  created_at: string
  package_id: string | null
  package_name: string | null
  package_features: string[]
  salesperson_name: string | null
  shareholderCount: number
  adminCount: number
}

const STATUS_STYLES: Record<string, string> = {
  PILOT: "bg-blue-50 text-blue-700 border border-blue-200",
  ACTIVE: "bg-green-50 text-green-700 border border-green-200",
  ARCHIVED: "bg-gray-100 text-gray-600 border border-gray-200",
}

export default function RecentProjectsTable({ data: initialData }: { data: ProjectRow[] }) {
  const [projects, setProjects] = useState<ProjectRow[]>(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null)
  const [adminDialog, setAdminDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({
    open: false, projectId: "", projectName: "",
  })

  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects")
      if (!res.ok) return
      const all: ProjectRow[] = await res.json()
      setProjects(all.slice(0, 5))
    } catch { /* silent */ }
  }, [])

  function handleProjectSuccess(project: { id: string; name: string }) {
    refreshProjects()
    if (!editingProject) {
      setAdminDialog({ open: true, projectId: project.id, projectName: project.name })
    }
    setEditingProject(null)
  }

  async function handleStatusChange(projectId: string, status: string) {
    const toastId = toast.loading("Updating project status…")
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success("Project status updated", { id: toastId })
      await refreshProjects()
    } catch {
      toast.error("Failed to update project status", { id: toastId })
    }
  }

  const columns: ColumnDef<ProjectRow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs uppercase tracking-wide text-gray-500 hover:text-gray-800"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name of Project <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <Link href={`/projects/${row.original.id}`} className="block group">
          <p className="font-bold text-gray-900 group-hover:text-[#4F46E5] transition-colors">
            {row.original.name}
          </p>
          {(row.original.area || row.original.address) && (
            <p className="text-xs text-gray-400 mt-0.5">{row.original.area ?? row.original.address}</p>
          )}
        </Link>
      ),
    },
    {
      accessorKey: "package_name",
      header: "Package",
      cell: ({ row }) => (
        row.original.package_name ? (
          <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {row.original.package_name}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs uppercase tracking-wide text-gray-500 hover:text-gray-800"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <span className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          STATUS_STYLES[row.original.status] ?? STATUS_STYLES.ARCHIVED
        )}>
          {row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: "adminCount",
      header: "No. of Project Admin",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.adminCount}</span>
      ),
    },
    {
      accessorKey: "shareholderCount",
      header: "No. of Shareholders",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.shareholderCount}</span>
      ),
    },
    {
      accessorKey: "salesperson_name",
      header: "Salesperson's Name",
      cell: ({ row }) => (
        row.original.salesperson_name ? (
          <span className="text-sm text-gray-700">{row.original.salesperson_name}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs uppercase tracking-wide text-gray-500 hover:text-gray-800"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Quick Actions</div>,
      cell: ({ row }) => {
        const project = row.original
        const isActive = project.status === "ACTIVE"
        const isArchived = project.status === "ARCHIVED"

        return (
          <div className="flex justify-end items-center gap-1">
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => { setEditingProject(project); setDialogOpen(true) }}
              title="Edit Project Details"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            {isActive ? (
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => handleStatusChange(project.id, "PILOT")}
                title="Set Inactive"
              >
                <ToggleLeft className="h-4 w-4" />
              </Button>
            ) : !isArchived ? (
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                onClick={() => handleStatusChange(project.id, "ACTIVE")}
                title="Set Active"
              >
                <ToggleRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="h-8 w-8" />
            )}

            {isArchived ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 cursor-not-allowed" disabled title="Already archived">
                <Archive className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-orange-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleStatusChange(project.id, "ARCHIVED")}
                title="Archive Project"
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-[#4F46E5] hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => setAdminDialog({ open: true, projectId: project.id, projectName: project.name })}
              title="Assign Admin"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: projects,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No projects yet</p>
        <p className="text-gray-400 text-sm mt-1">Create your first project to get started.</p>
      </div>
    )
  }

  return (
    <>
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleProjectSuccess}
        project={editingProject}
      />

      <CreateAdminDialog
        open={adminDialog.open}
        onOpenChange={(open) => setAdminDialog((prev) => ({ ...prev, open }))}
        projectId={adminDialog.projectId}
        projectName={adminDialog.projectName}
      />
    </>
  )
}
