"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table"
import { Plus, Search, Building2, ArrowUpDown, UserPlus, Pencil, ToggleLeft, ToggleRight, Archive, ArchiveRestore } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
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
import ProjectDialog from "@/components/super-admin/CreateProjectDialog"
import CreateAdminDialog from "@/components/super-admin/CreateAdminDialog"

interface Project {
  id: string
  name: string
  address: string | null
  area: string | null
  status: string
  start_date: string | null
  created_at: string
  shareholderCount: number
  adminCount: number
  salesperson_name: string | null
  package_name: string | null
  package_features: string[]
  package_id: string | null
}

const STATUS_STYLES: Record<string, string> = {
  PILOT: "bg-tertiary-container/20 text-tertiary border border-blue-200",
  ACTIVE: "bg-primary-container/20 text-primary border border-green-200",
  ARCHIVED: "bg-surface-variant/50 text-on-surface-variant border border-outline-variant/50",
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [sorting, setSorting] = useState<SortingState>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [adminDialog, setAdminDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({
    open: false,
    projectId: "",
    projectName: "",
  })

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      const data = await res.json()
      setProjects(data)
    } catch {
      toast.error("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  function handleProjectSuccess(project: { id: string; name: string }) {
    fetchProjects()
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
      if (!res.ok) throw new Error("Failed to update status")
      toast.success("Project status updated", { id: toastId })
      await fetchProjects()
    } catch {
      toast.error("Failed to update project status", { id: toastId })
    }
  }

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs uppercase tracking-wide text-on-surface-variant hover:text-on-surface"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name of Project <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <Link href={`/projects/${row.original.id}`} className="block group">
          <p className="font-bold text-on-surface group-hover:text-primary transition-colors">
            {row.original.name}
          </p>
          {(row.original.area || row.original.address) && (
            <p className="text-xs text-outline mt-0.5">{row.original.area ?? row.original.address}</p>
          )}
        </Link>
      ),
    },
    {
      accessorKey: "package_name",
      header: "Package",
      cell: ({ row }) => (
        row.original.package_name ? (
          <span className="inline-flex items-center rounded-full bg-primary-container/20 border border-primary-container px-2.5 py-0.5 text-xs font-medium text-primary">
            {row.original.package_name}
          </span>
        ) : (
          <span className="text-xs text-outline">—</span>
        )
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs uppercase tracking-wide text-on-surface-variant hover:text-on-surface"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          STATUS_STYLES[row.original.status] ?? STATUS_STYLES.ARCHIVED)}>
          {row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: "adminCount",
      header: "No. of Project Admin",
      cell: ({ row }) => (
        <span className="text-sm text-on-surface-variant">{row.original.adminCount}</span>
      ),
    },
    {
      accessorKey: "shareholderCount",
      header: "No. of Shareholders",
      cell: ({ row }) => (
        <span className="text-sm text-on-surface-variant">{row.original.shareholderCount}</span>
      ),
    },
    {
      accessorKey: "salesperson_name",
      header: "Salesperson's Name",
      cell: ({ row }) => (
        row.original.salesperson_name ? (
          <span className="text-sm text-on-surface">{row.original.salesperson_name}</span>
        ) : (
          <span className="text-xs text-outline">—</span>
        )
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
            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-tertiary hover:text-tertiary hover:bg-tertiary-container/20"
              onClick={() => {
                setEditingProject(project)
                setDialogOpen(true)
              }}
              title="Edit Project Details"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            {/* Active/Inactive toggle */}
            {isActive ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary-container/20"
                onClick={() => handleStatusChange(project.id, "PILOT")}
                title="Set Inactive → PILOT"
              >
                <ToggleLeft className="h-4 w-4" />
              </Button>
            ) : !isArchived ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-outline hover:text-on-surface-variant hover:bg-surface-variant/20"
                onClick={() => handleStatusChange(project.id, "ACTIVE")}
                title="Set Active"
              >
                <ToggleRight className="h-4 w-4" />
              </Button>
            ) : (
              /* Placeholder to keep layout stable when archived */
              <div className="h-8 w-8" />
            )}

            {/* Archive / Unarchive */}
            {isArchived ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-500 hover:text-tertiary hover:bg-tertiary-container/20"
                onClick={() => handleStatusChange(project.id, "PILOT")}
                title="Unarchive Project"
              >
                <ArchiveRestore className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-orange-500 hover:text-destructive hover:bg-error-container/20"
                onClick={() => handleStatusChange(project.id, "ARCHIVED")}
                title="Archive Project"
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Assign Admin */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary-container/20"
              onClick={() =>
                setAdminDialog({ open: true, projectId: project.id, projectName: project.name })
              }
              title="Assign Admin"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
    },
  ]

  const displayedProjects = useMemo(() => {
    return projects.filter((p) =>
      activeTab === "archived" ? p.status === "ARCHIVED" : p.status !== "ARCHIVED"
    )
  }, [projects, activeTab])

  const table = useReactTable({
    data: displayedProjects,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Projects</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage all NirmaN construction projects</p>
          </div>
          <Button
            onClick={() => {
              setEditingProject(null)
              setDialogOpen(true)
            }}
            className="bg-primary hover:bg-primary/90 text-white shrink-0 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        <div className="flex bg-surface-variant/50/50 p-1 rounded-lg w-fit mb-4 border border-outline-variant/50">
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "active" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Active Projects
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "archived" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Archived
          </button>
        </div>

        <Card className="bg-surface shadow-sm border border-outline-variant/30">
          {/* Search */}
          <CardHeader className="pb-3 border-b border-outline-variant/30">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
              <Input
                placeholder="Search projects..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Building2 className="h-14 w-14 text-outline-variant mb-4" />
                <p className="text-lg font-semibold text-on-surface">No projects yet</p>
                <p className="text-sm text-outline mt-1 max-w-xs">
                  Create your first construction project to get started.
                </p>
                <Button
                  className="mt-5 bg-primary hover:bg-primary/90 text-white"
                  onClick={() => {
                    setEditingProject(null)
                    setDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="bg-surface-variant/20/50">
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
                        <TableCell colSpan={columns.length} className="text-center py-10 text-outline">
                          No projects match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-surface-variant/20">
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
