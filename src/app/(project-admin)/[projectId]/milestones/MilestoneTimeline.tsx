"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Circle, Pencil, ArrowUp, ArrowDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Milestone {
  id: string
  name: string
  status: string
  start_date: string | null
  target_date: string | null
  sort_order: number
}

interface MilestoneTimelineProps {
  projectId: string
  initialMilestones: Milestone[]
}

export function MilestoneTimeline({ projectId, initialMilestones }: MilestoneTimelineProps) {
  const router = useRouter()
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  
  // form state elements
  const [name, setName] = useState("")
  const [status, setStatus] = useState("UPCOMING")
  const [startDate, setStartDate] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const openDialog = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone)
      setName(milestone.name)
      setStatus(milestone.status)
      setStartDate(milestone.start_date ? milestone.start_date.split("T")[0] : "")
      setTargetDate(milestone.target_date ? milestone.target_date.split("T")[0] : "")
    } else {
      setEditingMilestone(null)
      setName("")
      setStatus("UPCOMING")
      setStartDate("")
      setTargetDate("")
    }
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      const isEdit = !!editingMilestone
      const url = isEdit 
        ? `/api/projects/${projectId}/milestones/${editingMilestone.id}`
        : `/api/projects/${projectId}/milestones`
      
      let newSortOrder = 1
      if (!isEdit && milestones.length > 0) {
          newSortOrder = Math.max(...milestones.map(m => m.sort_order)) + 1
      }

      const body = isEdit 
        ? { name, status, start_date: startDate || null, target_date: targetDate || null }
        : { name, status, start_date: startDate || null, target_date: targetDate || null, sort_order: newSortOrder }

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to save milestone")
      }
      
      toast.success(isEdit ? "Milestone updated" : "Milestone created")
      setIsDialogOpen(false)
      
      // If we create, we get data back. If patch, we just refresh the whole route
      router.refresh()
      
      // Update local state optimistic-ish for simple render without perfect refresh timing
      const updatedData = isEdit ? milestones.map(m => m.id === editingMilestone.id ? { ...m, ...body } : m) : [...milestones, { id: 'temp', ...body }] as Milestone[]
      if(isEdit) setMilestones(updatedData)
      
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === milestones.length - 1) return

    const newMilestones = [...milestones]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap items locally
    const temp = newMilestones[index]
    newMilestones[index] = newMilestones[swapIndex]
    newMilestones[swapIndex] = temp

    // Reassign sort orders
    const mappedUpdates = newMilestones.map((m, i) => ({ id: m.id, sort_order: i + 1 }))
    
    // Optimistic update
    setMilestones(newMilestones.map((m, i) => ({ ...m, sort_order: i + 1 })))

    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: mappedUpdates }),
      })
      if (!res.ok) throw new Error("Failed to reorder")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
      // revert on fail by refreshing to DB state
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-6 sm:p-8 rounded-[1.25rem] border border-[var(--outline-variant)]/40 bg-[var(--surface-container-low)]">
        <div>
          <h2 className="text-2xl font-bold text-[var(--on-surface)]">Project Milestones</h2>
          <p className="text-sm text-[var(--on-surface-variant)] mt-1">Track the major phases of your construction.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      <div className="p-6 rounded-[1.25rem] border border-[var(--outline-variant)]/40 bg-[var(--surface)]">
         {milestones.length === 0 ? (
            <div className="text-center py-20 text-[var(--on-surface-variant)]">
               <div className="w-12 h-12 rounded-full bg-[var(--surface-variant)]/50 flex items-center justify-center mx-auto mb-4">
                 <Circle className="w-6 h-6 text-[var(--outline-variant)]" />
               </div>
               <p className="font-medium">No milestones added yet. Click 'Add Milestone' to get started.</p>
            </div>
         ) : (
            <div className="relative border-l-2 border-[var(--outline-variant)]/30 ml-4 pl-8 space-y-6 py-4">
              {milestones.map((milestone, idx) => {
                const isCompleted = milestone.status === "COMPLETED"
                const isInProgress = milestone.status === "IN_PROGRESS"
                const isUpcoming = milestone.status === "UPCOMING"

                return (
                  <div key={milestone.id} className="relative group">
                    <span className={`absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full ring-8
                      ${isCompleted ? 'bg-[var(--primary-container)] ring-[var(--surface)]' : ''}
                      ${isInProgress ? 'bg-[var(--primary-container)] ring-[var(--surface)]' : ''}
                      ${isUpcoming ? 'bg-[var(--surface-variant)] border-2 border-[var(--outline)] ring-[var(--surface)]' : ''}
                    `}>
                      {isCompleted && <CheckCircle2 className="h-5 w-5 text-[var(--on-primary-container)]" />}
                      {isInProgress && (
                        <div className="relative">
                          <Clock className="h-5 w-5 text-[var(--on-primary-container)] relative z-10" />
                          <div className="absolute inset-0 rounded-full bg-[var(--primary-container)] animate-ping opacity-25"></div>
                        </div>
                      )}
                      {isUpcoming && <Circle className="h-5 w-5 text-[var(--on-surface-variant)]" />}
                    </span>

                    {isInProgress && idx !== milestones.length - 1 && (
                         <div className="absolute top-8 -left-[27px] h-[calc(100%+2rem)] border-l-2 border-dashed border-[var(--primary)]/40 -z-10"></div>
                    )}
                    {isUpcoming && idx !== milestones.length - 1 && (
                         <div className="absolute top-8 -left-[27px] h-[calc(100%+2rem)] border-l-2 border-dotted border-[var(--outline-variant)]/30 -z-10"></div>
                    )}

                    <div className={`
                      p-5 rounded-2xl border transition-all duration-200
                      ${isCompleted ? 'bg-[var(--primary-container)]/10 border-[var(--primary-container)]/30' : ''}
                      ${isInProgress ? 'bg-[var(--primary-container)]/20 border-[var(--primary)]/40' : 'border-[var(--outline-variant)]/40'}
                      ${isUpcoming ? 'opacity-60 bg-[var(--surface-variant)]/20' : ''}
                    `}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`text-base font-semibold ${isUpcoming ? 'text-[var(--on-surface-variant)]' : 'text-[var(--on-surface)]'}`}>
                              {milestone.name}
                            </h3>
                            {isInProgress && (
                              <span className="flex h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--on-surface-variant)]">
                            {milestone.start_date && (
                              <p>
                                <span className="text-[10px] uppercase font-semibold opacity-60 mr-1">Start:</span>
                                {new Date(milestone.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                            )}
                            {milestone.target_date && (
                              <p>
                                <span className="text-[10px] uppercase font-semibold opacity-60 mr-1">Target:</span>
                                {new Date(milestone.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`
                            px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                            ${isCompleted ? 'bg-[var(--primary-container)]/50 text-[var(--on-primary-container)]' : ''}
                            ${isInProgress ? 'bg-[var(--tertiary-container)]/50 text-[var(--on-tertiary-container)]' : ''}
                            ${isUpcoming ? 'bg-[var(--surface-variant)]/50 text-[var(--on-surface-variant)]' : ''}
                          `}>
                            {milestone.status.replace("_", " ")}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="flex flex-col bg-[var(--surface-variant)]/30 rounded border border-[var(--outline-variant)]/40 overflow-hidden">
                               <button
                                 disabled={idx === 0}
                                 onClick={() => handleReorder(idx, 'up')}
                                 className="p-1.5 text-[var(--on-surface-variant)] hover:bg-[var(--surface-variant)] disabled:opacity-30"
                               ><ArrowUp className="w-3.5 h-3.5"/></button>
                               <button
                                 disabled={idx === milestones.length - 1}
                                 onClick={() => handleReorder(idx, 'down')}
                                 className="p-1.5 text-[var(--on-surface-variant)] hover:bg-[var(--surface-variant)] disabled:opacity-30 border-t border-[var(--outline-variant)]/40"
                               ><ArrowDown className="w-3.5 h-3.5"/></button>
                             </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openDialog(milestone)}
                              className="text-[var(--on-surface-variant)] hover:text-[var(--primary)] border-[var(--outline-variant)]/40"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
         )}
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
            <DialogDescription>
             {editingMilestone ? "Update milestone status and details." : "Add a new phase to the project."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Milestone Name *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., Foundation, Ground Floor" 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input 
                  id="start_date" 
                  type="date"
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date</Label>
                <Input 
                  id="target_date" 
                  type="date"
                  value={targetDate} 
                  onChange={(e) => setTargetDate(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
               <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form> 
        </DialogContent>
      </Dialog>
    </div>
  )
}
