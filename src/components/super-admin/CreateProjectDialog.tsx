"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  package_id: z.string().min(1, "Please select a package"),
  name: z.string().min(3, "Project name must be at least 3 characters"),
  address: z.string().optional(),
  area: z.string().optional(),
  start_date: z.date().optional(),
  expected_handover: z.date().optional(),
  status: z.enum(["PILOT", "ACTIVE"]),
  floors: z.string().optional(),
  units: z.string().optional(),
  salesperson_name: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (project: { id: string; name: string }) => void
  project?: any // If provided, it's Edit mode
}

export default function ProjectDialog({ open, onOpenChange, onSuccess, project }: Props) {
  const isEdit = !!project
  const [loading, setLoading] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [handoverOpen, setHandoverOpen] = useState(false)
  const [packages, setPackages] = useState<Array<{ id: string; name: string; features: string[]; is_active: boolean }>>([])
  const [packagesLoading, setPackagesLoading] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "PILOT" },
  })

  // Fetch packages when dialog opens — include current package even if inactive
  useEffect(() => {
    if (open) {
      setPackagesLoading(true)
      fetch("/api/packages")
        .then(r => r.json())
        .then((data: any[]) => {
          const all = data || []
          const active = all.filter((p) => p.is_active)
          // When editing, ensure the currently-assigned package is in the list
          // even if it was deactivated since assignment
          if (project?.package_id && !active.find((p) => p.id === project.package_id)) {
            const current = all.find((p) => p.id === project.package_id)
            if (current) active.unshift(current)
          }
          setPackages(active)
        })
        .catch(() => {})
        .finally(() => setPackagesLoading(false))
    }
  }, [open, project?.package_id])

  // Pre-populate if editing
  useEffect(() => {
    if (project && open) {
      reset({
        package_id: project.package_id || "",
        name: project.name,
        address: project.address || "",
        area: project.area || "",
        status: project.status,
        start_date: project.start_date ? new Date(project.start_date) : undefined,
        expected_handover: project.expected_handover ? new Date(project.expected_handover) : undefined,
        floors: project.building_meta?.floors?.toString() || "",
        units: project.building_meta?.units?.toString() || "",
        salesperson_name: project.building_meta?.salesperson_name || "",
      })
    } else if (open && !isEdit) {
      reset({ status: "PILOT", name: "", address: "", area: "", floors: "", units: "", salesperson_name: "", package_id: "" })
    }
  }, [project, open, reset, isEdit])

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const payload = {
        package_id: values.package_id,
        name: values.name,
        address: values.address || null,
        area: values.area || null,
        start_date: values.start_date ? format(values.start_date, "yyyy-MM-dd") : null,
        expected_handover: values.expected_handover ? format(values.expected_handover, "yyyy-MM-dd") : null,
        status: values.status,
        floors: values.floors ? parseInt(values.floors) : null,
        units: values.units ? parseInt(values.units) : null,
        salesperson_name: values.salesperson_name || null,
      }

      const url = isEdit ? `/api/projects/${project.id}/settings` : "/api/projects"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message ?? `Failed to ${isEdit ? 'update' : 'create'} project`)
      }

      const data = await res.json()
      toast.success(`Project ${isEdit ? 'updated' : 'created'} successfully!`)
      if (!isEdit) reset()
      onOpenChange(false)
      onSuccess({ id: isEdit ? project.id : data.id, name: values.name })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project Details" : "Create New Project"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Package */}
          <div className="space-y-1.5">
            <Label>Package <span className="text-red-500">*</span></Label>
            <Controller
              name="package_id"
              control={control}
              render={({ field }) => {
                const selectedPkg = field.value ? packages.find(p => p.id === field.value) : null
                return (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                    <SelectTrigger className="w-full">
                      {/* Base UI Select.Value doesn't auto-resolve controlled UUID → label,
                          so we render the label manually from local state */}
                      <span className={cn(
                        "flex flex-1 text-left text-sm truncate",
                        !selectedPkg && "text-muted-foreground"
                      )}>
                        {packagesLoading
                          ? "Loading packages..."
                          : selectedPkg
                            ? `${selectedPkg.name} (${selectedPkg.features?.length ?? 0} features)`
                            : "Select a package"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map(pkg => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.features?.length ?? 0} features)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }}
            />
            {errors.package_id && <p className="text-xs text-red-600">{errors.package_id.message}</p>}
          </div>

          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name" placeholder="e.g. Green Valley Heights" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="e.g. Plot 12, Road 4, Block C" {...register("address")} />
          </div>

          {/* Area */}
          <div className="space-y-1.5">
            <Label htmlFor="area">Area</Label>
            <Input id="area" placeholder="e.g. Bashundhara R/A" {...register("area")} />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PILOT">Pilot</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <Popover open={startOpen} onOpenChange={setStartOpen}>
                    <PopoverTrigger
                      className={cn(
                        "flex h-9 w-full items-center justify-start gap-2 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors hover:bg-muted",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0" />
                      {field.value ? format(field.value, "d MMM yyyy") : "Pick date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { field.onChange(date); setStartOpen(false) }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Expected Handover</Label>
              <Controller
                name="expected_handover"
                control={control}
                render={({ field }) => (
                  <Popover open={handoverOpen} onOpenChange={setHandoverOpen}>
                    <PopoverTrigger
                      className={cn(
                        "flex h-9 w-full items-center justify-start gap-2 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors hover:bg-muted",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0" />
                      {field.value ? format(field.value, "d MMM yyyy") : "Pick date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { field.onChange(date); setHandoverOpen(false) }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </div>

          {/* Floors + Units */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="floors">Total Floors</Label>
              <Input id="floors" type="number" min="1" placeholder="e.g. 8" {...register("floors")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="units">Total Units</Label>
              <Input id="units" type="number" min="1" placeholder="e.g. 16" {...register("units")} />
            </div>
          </div>

          {/* Salesperson */}
          <div className="space-y-1.5">
            <Label htmlFor="salesperson_name">Salesperson's Name</Label>
            <Input id="salesperson_name" placeholder="e.g. Rafiqul Islam" {...register("salesperson_name")} />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); reset() }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#4F46E5] hover:bg-[#14B8A6] text-white"
            >
              {!isEdit && <Plus className="h-4 w-4" />}
              {loading ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Project")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
