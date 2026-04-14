"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, UserPlus, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CommitteeClientProps {
  projectId: string
  currentRule: string
  members: any[]
  availableShareholders: any[]
}

export function CommitteeClient({
  projectId,
  currentRule,
  members,
  availableShareholders,
}: CommitteeClientProps) {
  const router = useRouter()
  const [rule, setRule] = useState(currentRule || "MAJORITY")
  const [isSavingRule, setIsSavingRule] = useState(false)
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)

  // -- handlers --
  const handleSaveRule = async () => {
    setIsSavingRule(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/committee/approval-rule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule }),
      })
      if (!res.ok) throw new Error("Failed to update rule")
      toast.success("Approval rule updated successfully")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSavingRule(false)
    }
  }

  const handleAddMember = async (shareholderId: string, userId: string) => {
    setIsAddingMember(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/committee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareholder_id: shareholderId, user_id: userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to add committee member")
      
      toast.success("Member added to committee")
      setIsAddDialogOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the committee?")) return

    try {
      const res = await fetch(`/api/projects/${projectId}/committee/${memberId}`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error("Failed to remove committee member")
      toast.success("Member removed from committee")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Approval Rule Card */}
      <section className="border border-outline-variant/40 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant/40 bg-surface-variant">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-container/50 text-primary rounded-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-on-surface">Governance & Approval Rule</h2>
              <p className="text-sm text-on-surface-variant">Define how project expenses and decisions are approved.</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <label
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                rule === "MAJORITY" ? "border-primary ring-1 ring-primary" : "border-outline-variant"
              }`}
            >
              <input
                type="radio"
                name="approvalRule"
                value="MAJORITY"
                className="sr-only"
                checked={rule === "MAJORITY"}
                onChange={(e) => setRule(e.target.value)}
              />
              <span className="flex flex-1">
                <span className="flex flex-col">
                  <span className="block text-sm font-medium text-on-surface">Majority Approval</span>
                  <span className="mt-1 flex items-center text-sm text-on-surface-variant">
                    Requires &gt; 50% of active committee members to approve. Ideal for balanced decision-making.
                  </span>
                </span>
              </span>
              <ShieldCheck
                className={`h-5 w-5 ${rule === "MAJORITY" ? "text-primary" : "text-transparent"}`}
                aria-hidden="true"
              />
            </label>

            <label
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                rule === "ANY_SINGLE" ? "border-primary ring-1 ring-primary" : "border-outline-variant"
              }`}
            >
              <input
                type="radio"
                name="approvalRule"
                value="ANY_SINGLE"
                className="sr-only"
                checked={rule === "ANY_SINGLE"}
                onChange={(e) => setRule(e.target.value)}
              />
              <span className="flex flex-1">
                <span className="flex flex-col">
                  <span className="block text-sm font-medium text-on-surface">Any Single Member</span>
                  <span className="mt-1 flex items-center text-sm text-on-surface-variant">
                    Allows any single active committee member to approve. Faster, but requires high trust.
                  </span>
                </span>
              </span>
              <ShieldCheck
                 className={`h-5 w-5 ${rule === "ANY_SINGLE" ? "text-primary" : "text-transparent"}`}
                aria-hidden="true"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveRule}
              disabled={isSavingRule || rule === currentRule}
              className="bg-primary hover:bg-primary"
            >
              {isSavingRule ? "Saving..." : "Save Rule"}
            </Button>
          </div>
        </div>
      </section>

      {/* Committee Members Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
           <div>
            <h3 className="text-lg font-medium leading-6 text-on-surface flex items-center gap-2">
              Committee Members
               <span className="inline-flex items-center rounded-full bg-surface-variant/50 px-2.5 py-0.5 text-xs font-medium text-on-surface">
                  {members.length}
                </span>
            </h3>
           </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            variant="default"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>

        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit/Flat</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length > 0 ? (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-on-surface">
                      {member.shareholders?.profiles?.name}
                    </TableCell>
                    <TableCell>{member.shareholders?.unit_flat}</TableCell>
                    <TableCell className="text-on-surface-variant">{member.shareholders?.profiles?.email}</TableCell>
                    <TableCell className="text-on-surface-variant text-sm">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive hover:bg-error-container/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                     <div className="flex flex-col items-center justify-center text-on-surface-variant">
                      <Users className="h-8 w-8 text-outline mb-2" />
                      <p>No committee members yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add to Committee</DialogTitle>
            <DialogDescription>
              Select an active shareholder to add to the governing committee.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto">
            {availableShareholders.length > 0 ? (
              availableShareholders.map((sh) => (
                <div key={sh.id} className="flex items-center justify-between p-3 border border-outline-variant/40 rounded-lg hover:border-primary transition-colors">
                  <div>
                    <h4 className="font-medium text-sm text-on-surface">{sh.profiles?.name || "Unknown"}</h4>
                    <p className="text-xs text-on-surface-variant">Unit: {sh.unit_flat} | {sh.profiles?.email || "No email"}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={isAddingMember}
                    className="bg-primary hover:bg-primary"
                    onClick={() => handleAddMember(sh.id, sh.user_id)}
                  >
                    Add
                  </Button>
                </div>
              ))
            ) : (
               <div className="text-center py-6 text-on-surface-variant text-sm">
                 No eligible shareholders found to add.
               </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
