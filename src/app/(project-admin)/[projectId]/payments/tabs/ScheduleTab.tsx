import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Plus, Calendar as CalendarIcon, Pencil, Trash2, MoreVertical } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ScheduleTab({ projectId, scheduleItems, payments, milestones, shareholders }: { projectId: string, scheduleItems: any[], payments: any[], milestones: any[], shareholders: any[] }) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState("")
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editMilestoneId, setEditMilestoneId] = useState("")

  // Form State (New)
  const [shareholderId, setShareholderId] = useState("")
  const [milestoneId, setMilestoneId] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")

  const getPaidAmount = (scheduleId: string) => {
    return payments
      .filter(p => p.schedule_item_id === scheduleId)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  }

  const getPenalty = (item: any) => {
    if (!item.penalties) return 0
    return item.penalties
      .filter((p: any) => !p.is_waived)
      .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
  }

  const handleCreate = async () => {
    if (!shareholderId || !amount || !dueDate) {
      toast.error("Please fill in shareholder, amount, and due date.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           shareholder_id: shareholderId,
           milestone_id: milestoneId || null,
           amount,
           due_date: dueDate
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success("Schedule collection created successfully!")
      setIsModalOpen(false)
      
      setShareholderId("")
      setMilestoneId("")
      setAmount("")
      setDueDate("")

      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (item: any) => {
    setEditingItem(item)
    setEditAmount(item.amount.toString())
    setEditDate(new Date(item.due_date).toISOString().split('T')[0])
    setEditStatus(item.status)
    setEditMilestoneId(item.milestone_id || "none")
  }

  const handleUpdate = async () => {
    if (!editingItem) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/schedules/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: editAmount,
          due_date: editDate,
          status: editStatus,
          milestone_id: editMilestoneId
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success("Installment updated successfully")
      setEditingItem(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this installment requirement? This cannot be undone.")) return
    
    try {
      const res = await fetch(`/api/projects/${projectId}/schedules/${itemId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success("Installment deleted")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const statusConfig: Record<string, string> = {
    UPCOMING: "bg-gray-100 text-gray-700",
    DUE: "bg-blue-100 text-blue-700",
    OVERDUE: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800"
  }

  const filteredItems = filterStatus 
    ? scheduleItems.filter(item => item.status === filterStatus) 
    : scheduleItems

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
       <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
         <select 
           value={filterStatus}
           onChange={(e) => setFilterStatus(e.target.value)}
           className="border-gray-300 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500 block p-2 px-3 bg-white"
         >
           <option value="">All Statuses</option>
           <option value="DUE">Due</option>
           <option value="OVERDUE">Overdue</option>
           <option value="UPCOMING">Upcoming</option>
           <option value="PARTIALLY_PAID">Partially Paid</option>
           <option value="PAID">Paid</option>
         </select>
         <Button onClick={() => setIsModalOpen(true)} className="bg-[#4F46E5] hover:bg-indigo-800 text-sm h-9">
            <Plus className="w-4 h-4 mr-2" /> Add Custom Collection
         </Button>
       </div>
       <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Due Date</TableHead>
              <TableHead>Shareholder</TableHead>
              <TableHead>Milestone</TableHead>
              <TableHead className="text-right">Expected (৳)</TableHead>
              <TableHead className="text-right">Paid (৳)</TableHead>
              <TableHead className="text-right text-red-600">Penalty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={8} className="p-0 border-0">
                    <EmptyState
                      icon={CalendarIcon}
                      title="No payment schedules yet"
                      description="Create payment obligations for shareholders based on milestones or custom dates."
                      actionLabel="Add Collection"
                      onAction={() => setIsModalOpen(true)}
                      className="border-0 rounded-none shadow-none"
                    />
                 </TableCell>
               </TableRow>
            ) : (
               filteredItems.map(item => {
                 const uiStyle = statusConfig[item.status] || statusConfig.UPCOMING
                 const isOverdue = item.status === 'OVERDUE'
                 return (
                   <TableRow key={item.id} className={isOverdue ? "border-l-4 border-l-red-500" : ""}>
                      <TableCell className="text-sm font-medium">{new Date(item.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">{item.shareholder?.profiles?.name}</div>
                        <div className="text-xs text-gray-500">Unit: {item.shareholder?.unit_flat}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{item.milestone?.name || 'General'}</TableCell>
                      <TableCell className="text-right font-medium text-gray-900">{parseFloat(item.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-sm text-indigo-700 font-semibold">{getPaidAmount(item.id).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-sm text-red-600">{getPenalty(item).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${uiStyle}`}>
                            {item.status.replace("_", " ")}
                         </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Installment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                   </TableRow>
                 )
               })
            )}
          </TableBody>
       </Table>

       {/* CREATE DIALOG */}
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
         <DialogContent className="sm:max-w-[450px]">
           <DialogHeader>
             <DialogTitle>Add Collection Requirement</DialogTitle>
             <DialogDescription>Assign a custom payment obligation to a shareholder.</DialogDescription>
           </DialogHeader>
           <div className="space-y-4 mt-4">
              <div className="space-y-2">
                 <Label>Shareholder *</Label>
                 <Select value={shareholderId} onValueChange={(v) => setShareholderId(v ?? "")}>
                   <SelectTrigger>
                      <span className="flex-1 text-left truncate">
                        {shareholderId ? shareholders.find(s => s.id === shareholderId)?.profiles?.name : "Select shareholder"}
                      </span>
                   </SelectTrigger>
                   <SelectContent>
                     {shareholders.map(s => (
                       <SelectItem key={s.id} value={s.id}>{s.profiles?.name} (Unit: {s.unit_flat})</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label>Target Milestone (Optional)</Label>
                 <Select value={milestoneId} onValueChange={(v) => setMilestoneId(v ?? "")}>
                   <SelectTrigger>
                      <span className="flex-1 text-left truncate">
                        {milestoneId && milestoneId !== "none" ? milestones.find(m => m.id === milestoneId)?.name : "General / Non-milestone"}
                      </span>
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">General</SelectItem>
                     {milestones.map(m => (
                       <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Expected Amount (৳) *</Label>
                    <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                 </div>
                 <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                 </div>
              </div>
              <DialogFooter className="pt-4">
                 <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                 <Button onClick={handleCreate} disabled={isSubmitting} className="bg-indigo-700 hover:bg-indigo-800">
                    {isSubmitting ? "Creating..." : "Schedule Collection"}
                 </Button>
              </DialogFooter>
           </div>
         </DialogContent>
       </Dialog>

       {/* EDIT DIALOG */}
       <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
         <DialogContent className="sm:max-w-[450px]">
           <DialogHeader>
             <DialogTitle>Edit Installment</DialogTitle>
             <DialogDescription>Update the details for this payment requirement.</DialogDescription>
           </DialogHeader>
           <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Expected Amount (৳)</Label>
                    <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                 </div>
              </div>
              <div className="space-y-2">
                 <Label>Milestone</Label>
                 <Select value={editMilestoneId} onValueChange={setEditMilestoneId}>
                   <SelectTrigger>
                     <span className="flex-1 text-left truncate">
                        {editMilestoneId && editMilestoneId !== "none" ? milestones.find(m => m.id === editMilestoneId)?.name : "General"}
                     </span>
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">General</SelectItem>
                     {milestones.map(m => (
                       <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label>Status Override</Label>
                 <Select value={editStatus} onValueChange={setEditStatus}>
                   <SelectTrigger>
                      <span className="flex-1 text-left truncate uppercase text-xs font-bold">{editStatus.replace("_", " ")}</span>
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="UPCOMING">Upcoming</SelectItem>
                     <SelectItem value="DUE">Due</SelectItem>
                     <SelectItem value="OVERDUE">Overdue</SelectItem>
                     <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                     <SelectItem value="PAID">Paid</SelectItem>
                   </SelectContent>
                 </Select>
                 <p className="text-[10px] text-gray-500 italic">Note: Manually overriding status might be reverted by the payment engine if it detects conflicting records.</p>
              </div>
              <DialogFooter className="pt-4">
                 <Button variant="outline" onClick={() => setEditingItem(null)} disabled={isSubmitting}>Cancel</Button>
                 <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-indigo-700 hover:bg-indigo-800">
                    {isSubmitting ? "Updating..." : "Save Changes"}
                 </Button>
              </DialogFooter>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  )
}

