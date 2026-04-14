"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { UploadDropzone } from "@/components/UploadDropzone"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface ExpenseFormProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  milestones: any[]
  categories: any[]
  expense?: any // Optional: if provided, we are in edit mode
}

export function ExpenseForm({ projectId, isOpen, onClose, milestones, categories, expense }: ExpenseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  // Form State
  const [title, setTitle] = useState("")
  const [milestoneId, setMilestoneId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [vatAmount, setVatAmount] = useState("")
  const [invoiceNo, setInvoiceNo] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (isOpen && expense) {
      setTitle(expense.title || "")
      setMilestoneId(expense.milestone_id || "")
      setCategoryId(expense.category_id || "")
      setAmount(expense.amount ? String(expense.amount) : "")
      setDate(expense.date ? new Date(expense.date).toISOString().split('T')[0] : "")
      setVatAmount(expense.vat_amount ? String(expense.vat_amount) : "")
      setInvoiceNo(expense.invoice_no || "")
      setNotes(expense.notes || "")
      setFiles([])
    } else if (isOpen && !expense) {
      resetForm()
    }
  }, [isOpen, expense])

  const resetForm = () => {
    setTitle("")
    setMilestoneId("")
    setCategoryId("")
    setAmount("")
    setDate("")
    setVatAmount("")
    setInvoiceNo("")
    setNotes("")
    setFiles([])
  }

  const handleSave = async (submitForApproval: boolean) => {
    if (!title || !milestoneId || !categoryId || !amount || !date) {
      toast.error("Please fill all required fields")
      return
    }

    // Must have at least 1 file attached total if submitting for approval
    // Note: if editing and already has attachments in db we ideally should check that, but for simplicity we'll just check if files array has something OR it's an edit and we assume they uploaded before.
    if (submitForApproval && files.length === 0 && !expense?.attachments?.length) {
      toast.error("You must upload at least one proof attachment to submit for approval.")
      return
    }

    setIsSubmitting(true)
    try {
      let expenseId = expense?.id
      
      const payload = {
         title,
         milestone_id: milestoneId,
         category_id: categoryId,
         amount,
         date,
         vat_amount: vatAmount,
         invoice_no: invoiceNo,
         notes
      }

      if (expense) {
        // Edit Mode
        const res = await fetch(`/api/projects/${projectId}/expenses/${expense.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
      } else {
        // Create Mode
        const res = await fetch(`/api/projects/${projectId}/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        expenseId = data.expense.id
      }

      // Upload new attachments if any
      if (files.length > 0 && expenseId) {
        const uploadPromises = files.map(async (file) => {
           const formData = new FormData()
           formData.append("file", file)
           
           const attRes = await fetch(`/api/projects/${projectId}/expenses/${expenseId}/attachments`, {
             method: "POST",
             body: formData
           })
           if (!attRes.ok) {
             const attData = await attRes.json()
             console.error("Attachment err:", attData.error)
             throw new Error(attData.error || `Failed to upload ${file.name}`)
           }
        })
        await Promise.all(uploadPromises)
      }

      // Mark as submitted if requested
      if (submitForApproval && expenseId) {
         const submitRes = await fetch(`/api/projects/${projectId}/expenses/${expenseId}/submit`, { method: "POST" })
         if (!submitRes.ok) {
            const submitData = await submitRes.json()
            throw new Error(submitData.error || "Failed to submit for approval")
         }
         toast.success("Expense submitted for approval!")
      } else {
         toast.success(expense ? "Expense updated." : "Expense saved as draft.")
      }

      resetForm()
      onClose()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedMilestone = milestones.find(m => m.id === milestoneId)
  const selectedCategory = categories.find(c => c.id === categoryId)
  const isEditing = !!expense

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
             {isEditing ? "Modify expense details before submission." : "Record a new project expense. Attach proofs before submitting for approval."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4 py-4 border-y">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title/Description *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cement bags for foundation" />
              </div>
              <div className="space-y-2">
                 <Label>Date *</Label>
                 <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phase / Milestone *</Label>
                <Select value={milestoneId} onValueChange={(v) => setMilestoneId(v ?? "")}>
                  <SelectTrigger>
                     <span className="flex-1 text-left truncate">
                       {selectedMilestone ? selectedMilestone.name : <span className="text-muted-foreground">Select Milestone</span>}
                     </span>
                  </SelectTrigger>
                  <SelectContent>
                    {milestones.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                  <SelectTrigger>
                     <span className="flex-1 text-left truncate">
                       {selectedCategory ? selectedCategory.name : <span className="text-muted-foreground">Select Category</span>}
                     </span>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                 <Label>Total Amount (৳) *</Label>
                 <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                 <Label>VAT Amount (৳)</Label>
                 <Input type="number" step="0.01" value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                 <Label>Invoice No.</Label>
                 <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="INV-001" />
              </div>
           </div>

           <div className="space-y-2">
             <Label>Notes</Label>
             <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional details..." className="h-20" />
           </div>

           <div className="space-y-2 pt-2 border-t mt-4">
             <Label>Add More Proof Attachments</Label>
             <UploadDropzone onFilesSelected={setFiles} maxFiles={5} />
           </div>
        </div>

        <div className="flex justify-between mt-6">
           <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
           <div className="flex gap-2">
             <Button variant="secondary" onClick={() => handleSave(false)} disabled={isSubmitting}>
               Save {isEditing ? "Changes" : "as Draft"}
             </Button>
             <Button onClick={() => handleSave(true)} disabled={isSubmitting} className="bg-primary hover:bg-primary">
               {isSubmitting ? "Processing..." : "Submit for Approval"}
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
