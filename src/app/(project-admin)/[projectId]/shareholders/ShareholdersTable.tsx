"use client"

import { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
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
import { MoreHorizontal, Pencil, Search, ToggleLeft, ToggleRight, UserPlus, Users } from "lucide-react"
import { ShareholderDialog } from "./ShareholdersForms"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/EmptyState"

interface ShareholdersTableProps {
  projectId: string
  data: any[]
}

export function ShareholdersTable({ projectId, data }: ShareholdersTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([{ id: "unit_flat", desc: false }])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingShareholder, setEditingShareholder] = useState<any>(null)

  const handleStatusToggle = async (shareholder: any) => {
    const newStatus = shareholder.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      const res = await fetch(`/api/projects/${projectId}/shareholders/${shareholder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error("Failed to update status")
      toast.success(`Status updated to ${newStatus}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorFn: (row) => row.profiles?.name,
      id: "name",
      header: "Name",
      cell: (info) => <div className="font-medium text-gray-900">{info.getValue() as string}</div>,
    },
    {
      accessorFn: (row) => row.profiles?.email,
      id: "email",
      header: "Email",
      cell: (info) => <div className="text-gray-500">{info.getValue() as string}</div>,
    },
    {
      accessorFn: (row) => row.profiles?.phone,
      id: "phone",
      header: "Phone",
      cell: (info) => <div className="text-gray-500">{info.getValue() as string || "—"}</div>,
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
        return val ? <div className="text-gray-500">{val}%</div> : "—"
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const isActive = status === "ACTIVE"
        return (
          <Badge className={isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
             {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const shareholder = row.original
        const isActive = shareholder.status === "ACTIVE"

        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingShareholder(shareholder)
                  setIsDialogOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusToggle(shareholder)}
                className={isActive ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}
              >
                {isActive ? (
                  <><ToggleLeft className="mr-2 h-4 w-4" /> Deactivate</>
                ) : (
                  <><ToggleRight className="mr-2 h-4 w-4" /> Activate</>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  })

  // Basic Stats calculation
  const total = data.length
  const active = data.filter(s => s.status === "ACTIVE").length
  const inactive = total - active

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shareholders</h2>
          <p className="text-sm text-gray-500">Manage unit owners and their information</p>
        </div>
        <Button 
          onClick={() => {
            setEditingShareholder(null)
            setIsDialogOpen(true)
          }} 
          className="bg-[#0F766E] hover:bg-teal-800"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Shareholder
        </Button>
      </div>

      {/* Stats Badges */}
      <div className="flex gap-2">
         <Badge variant="outline" className="text-gray-600 bg-white">Total: {total}</Badge>
         <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Active: {active}</Badge>
         <Badge variant="outline" className="text-gray-500 bg-gray-50 border-gray-200">Inactive: {inactive}</Badge>
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b">
           <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email or unit..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
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
              table.getRowModel().rows.map((row) => (
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
        
        {/* Pagination Info */}
        <div className="flex items-center justify-between px-4py-3 border-t">
          <div className="flex-1 text-sm text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </div>
          <div className="space-x-2">
             <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
          </div>
        </div>
      </div>

       <ShareholderDialog
         projectId={projectId}
         isOpen={isDialogOpen}
         onClose={() => setIsDialogOpen(false)}
         shareholder={editingShareholder}
       />
    </div>
  )
}
