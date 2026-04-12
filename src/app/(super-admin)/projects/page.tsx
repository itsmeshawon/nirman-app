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
import { formatDistanceToNow } from "date-fns"
import { Plus, Search, Building2, ArrowUpDown, UserPlus } from "lucide-react"
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
import CreateProjectDialog from "@/components/super-admin/CreateProjectDialog"
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
}

const STATUS_STYLES: Record<string, string> = {
  PILOT: "bg-blue-50 text-blue-700 border border-blue-200",
  ACTIVE: "bg-green-50 text-green-700 border border-green-200",
  ARCHIVED: "bg-gray-100 text-gray-600 border border-gray-200",
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [createOpen, setCreateOpen] = useState(false)
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

  function handleProjectCreated(project: { id: string; name: string }) {
    fetchProjects()
    // Prompt to assign an admin
    setAdminDialog({ open: true, projectId: project.id, projectName: project.name })
  }

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs uppercase tracking-wide text-gray-500 hover:text-gray-800"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.name}</p>
          {(row.original.area || row.original.address) && (
            <p className="text-xs text-gray-400 mt-0.5">{row.original.area ?? row.original.address}</p>
          )}
        </div>
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
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          STATUS_STYLES[row.original.status] ?? STATUS_STYLES.ARCHIVED)}>
          {row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.start_date ? formatDate(row.original.start_date) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "shareholderCount",
      header: "Shareholders",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.shareholderCount}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs uppercase tracking-wide text-gray-500 hover:text-gray-800"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() =>
            setAdminDialog({ open: true, projectId: row.original.id, projectName: row.original.name })
          }
          className="flex items-center gap-1.5 text-xs text-[#0F766E] hover:underline font-medium min-h-[44px] px-1"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Assign Admin
        </button>
      ),
    },
  ]

  const table = useReactTable({
    data: projects,
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
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage all NirmaN construction projects</p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#0F766E] hover:bg-[#14B8A6] text-white shrink-0 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        <Card className="bg-white shadow-sm border border-gray-100">
          {/* Search */}
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Building2 className="h-14 w-14 text-gray-200 mb-4" />
                <p className="text-lg font-semibold text-gray-700">No projects yet</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">
                  Create your first construction project to get started.
                </p>
                <Button
                  className="mt-5 bg-[#0F766E] hover:bg-[#14B8A6] text-white"
                  onClick={() => setCreateOpen(true)}
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
                          No projects match your search.
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
      </div>

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleProjectCreated}
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
