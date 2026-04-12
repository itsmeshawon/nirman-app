import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Plus } from "lucide-react"

export function ScheduleTab({ projectId, scheduleItems, payments, milestones, shareholders }: { projectId: string, scheduleItems: any[], payments: any[], milestones: any[], shareholders: any[] }) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
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
      
      // reset form
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
           className="border-gray-300 rounded text-sm focus:ring-teal-500 focus:border-teal-500 block p-2 px-3 bg-white"
         >
           <option value="">All Statuses</option>
           <option value="DUE">Due</option>
           <option value="OVERDUE">Overdue</option>
           <option value="UPCOMING">Upcoming</option>
           <option value="PARTIALLY_PAID">Partially Paid</option>
           <option value="PAID">Paid</option>
         </select>
         <Button onClick={() => setIsModalOpen(true)} className="bg-[#0F766E] hover:bg-teal-800 text-sm h-9">
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
              <TableHead className="text-right">Penalty</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="text-center py-8 text-gray-500">No scheduled collections found</TableCell>
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
                      <TableCell className="text-right text-sm text-teal-700">{getPaidAmount(item.id).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-sm text-red-600">{getPenalty(item).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                         <span className={`px-2 py-0.5 rounded text-xs font-semibold ${uiStyle}`}>
                            {item.status.replace("_", " ")}
                         </span>
                      </TableCell>
                   </TableRow>
                 )
               })
            )}
          </TableBody>
       </Table>

       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
         <DialogContent className="sm:max-w-[450px]">
           <DialogHeader>
             <DialogTitle>Add Collection Requirement</DialogTitle>
             <DialogDescription>Assign a custom payment obligation to a shareholder.</DialogDescription>
           </DialogHeader>

           <div className="space-y-4 mt-4">
              <div className="space-y-2">
                 <Label>Shareholder *</Label>
                 <Select value={shareholderId} onValueChange={setShareholderId}>
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
                 <Select value={milestoneId} onValueChange={setMilestoneId}>
                   <SelectTrigger>
                      <span className="flex-1 text-left truncate">
                        {milestoneId ? milestones.find(m => m.id === milestoneId)?.name : "General / Non-milestone"}
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

              <div className="pt-4 flex justify-end gap-2">
                 <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                 <Button onClick={handleCreate} disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800">
                    {isSubmitting ? "Creating..." : "Schedule Collection"}
                 </Button>
              </div>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  )
}
