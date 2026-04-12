"use client"

import { useState } from "react"
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
  name: z.string().min(3, "Project name must be at least 3 characters"),
  address: z.string().optional(),
  area: z.string().optional(),
  start_date: z.date().optional(),
  expected_handover: z.date().optional(),
  status: z.enum(["PILOT", "ACTIVE"]),
  floors: z.string().optional(),
  units: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (project: { id: string; name: string }) => void
}

export default function CreateProjectDialog({ open, onOpenChange, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [handoverOpen, setHandoverOpen] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "PILOT" },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const payload = {
        name: values.name,
        address: values.address || undefined,
        area: values.area || undefined,
        start_date: values.start_date ? format(values.start_date, "yyyy-MM-dd") : undefined,
        expected_handover: values.expected_handover ? format(values.expected_handover, "yyyy-MM-dd") : undefined,
        status: values.status,
        floors: values.floors ? parseInt(values.floors) : undefined,
        units: values.units ? parseInt(values.units) : undefined,
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message ?? "Failed to create project")
      }

      const project = await res.json()
      toast.success("Project created successfully!")
      reset()
      onOpenChange(false)
      onCreated({ id: project.id, name: project.name })
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
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
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
              className="bg-[#0F766E] hover:bg-[#14B8A6] text-white"
            >
              <Plus className="h-4 w-4" />
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
