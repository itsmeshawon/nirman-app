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
  const [targetDate, setTargetDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const openDialog = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone)
      setName(milestone.name)
      setStatus(milestone.status)
      setTargetDate(milestone.target_date ? milestone.target_date.split("T")[0] : "")
    } else {
      setEditingMilestone(null)
      setName("")
      setStatus("UPCOMING")
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
        ? { name, status, target_date: targetDate || null }
        : { name, status, target_date: targetDate || null, sort_order: newSortOrder }

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Failed to save milestone")
      
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
      <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Project Milestones</h2>
          <p className="text-sm text-gray-500 mt-1">Track the major phases of your construction.</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-[#4F46E5] hover:bg-indigo-800">
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
         {milestones.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
               No milestones added yet. Click 'Add Milestone' to get started.
            </div>
         ) : (
            <div className="relative border-l-2 border-gray-200 ml-4 pl-8 space-y-8 py-4">
              {milestones.map((milestone, idx) => {
                const isCompleted = milestone.status === "COMPLETED"
                const isInProgress = milestone.status === "IN_PROGRESS"
                const isUpcoming = milestone.status === "UPCOMING"

                return (
                  <div key={milestone.id} className="relative group">
                    {/* Visual Timeline Node */}
                    <span className="absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full bg-white ring-8 ring-white">
                      {isCompleted && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                      {isInProgress && (
                        <div className="relative">
                          <Clock className="h-6 w-6 text-blue-500 relative z-10" />
                          <div className="absolute inset-0 rounded-full border-blue-500 animate-ping opacity-75 ring-4 ring-blue-200"></div>
                        </div>
                      )}
                      {isUpcoming && <Circle className="h-6 w-6 text-gray-300" />}
                    </span>
                    
                    {/* Connector Line formatting trick using border-l on the parent element overall, 
                        but we can also style specific next lines if we want dashed lines between specific statuses */}
                    {isInProgress && idx !== milestones.length - 1 && (
                         <div className="absolute top-8 -left-[27px] h-[calc(100%+2rem)] border-l-2 border-dashed border-blue-300 -z-10 bg-white"></div>
                    )}
                    {isUpcoming && idx !== milestones.length - 1 && (
                         <div className="absolute top-8 -left-[27px] h-[calc(100%+2rem)] border-l-2 border-dotted border-gray-200 -z-10 bg-white"></div>
                    )}

                    {/* Content */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                      <div>
                        <h3 className={`text-lg font-medium ${isUpcoming ? 'text-gray-600' : 'text-gray-900'}`}>
                          {milestone.name}
                        </h3>
                        {milestone.target_date && (
                          <p className="text-sm text-gray-500 mt-1">
                            Target: {new Date(milestone.target_date).toLocaleDateString()}
                          </p>
                        )}
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-2
                          ${isCompleted ? 'bg-green-100 text-green-800' : ''}
                          ${isInProgress ? 'bg-blue-100 text-blue-800' : ''}
                          ${isUpcoming ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {milestone.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="flex flex-col bg-gray-50 rounded shadow-sm border border-gray-200 overflow-hidden mr-2">
                           <button 
                             disabled={idx === 0}
                             onClick={() => handleReorder(idx, 'up')}
                             className="p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                           ><ArrowUp className="w-3 h-3"/></button>
                           <button 
                             disabled={idx === milestones.length - 1}
                             onClick={() => handleReorder(idx, 'down')}
                             className="p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 border-t border-gray-200"
                           ><ArrowDown className="w-3 h-3"/></button>
                         </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openDialog(milestone)}
                          className="text-gray-600 hover:text-[#4F46E5] border-gray-200"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
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
            
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date (Optional)</Label>
              <Input 
                id="target_date" 
                type="date"
                value={targetDate} 
                onChange={(e) => setTargetDate(e.target.value)} 
              />
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
               <Button type="submit" disabled={isLoading} className="bg-[#4F46E5] hover:bg-indigo-800">
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form> 
        </DialogContent>
      </Dialog>
    </div>
  )
}
