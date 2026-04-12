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
      if (!res.ok) throw new Error("Failed to add committee member")
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
      <section className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Governance & Approval Rule</h2>
              <p className="text-sm text-gray-500">Define how project expenses and decisions are approved.</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <label
              className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
                rule === "MAJORITY" ? "border-[#0F766E] ring-1 ring-[#0F766E]" : "border-gray-300"
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
                  <span className="block text-sm font-medium text-gray-900">Majority Approval</span>
                  <span className="mt-1 flex items-center text-sm text-gray-500">
                    Requires &gt; 50% of active committee members to approve. Ideal for balanced decision-making.
                  </span>
                </span>
              </span>
              <ShieldCheck
                className={`h-5 w-5 ${rule === "MAJORITY" ? "text-[#0F766E]" : "text-transparent"}`}
                aria-hidden="true"
              />
            </label>

            <label
              className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
                rule === "ANY_SINGLE" ? "border-[#0F766E] ring-1 ring-[#0F766E]" : "border-gray-300"
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
                  <span className="block text-sm font-medium text-gray-900">Any Single Member</span>
                  <span className="mt-1 flex items-center text-sm text-gray-500">
                    Allows any single active committee member to approve. Faster, but requires high trust.
                  </span>
                </span>
              </span>
              <ShieldCheck
                 className={`h-5 w-5 ${rule === "ANY_SINGLE" ? "text-[#0F766E]" : "text-transparent"}`}
                aria-hidden="true"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveRule}
              disabled={isSavingRule || rule === currentRule}
              className="bg-[#0F766E] hover:bg-teal-800"
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
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
              Committee Members
               <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                  {members.length}
                </span>
            </h3>
           </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-white text-[#0F766E] border border-[#0F766E] hover:bg-teal-50"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
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
                    <TableCell className="font-medium text-gray-900">
                      {member.shareholders?.profiles?.name}
                    </TableCell>
                    <TableCell>{member.shareholders?.unit_flat}</TableCell>
                    <TableCell className="text-gray-500">{member.shareholders?.profiles?.email}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                     <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users className="h-8 w-8 text-gray-400 mb-2" />
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
                <div key={sh.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-teal-500 transition-colors">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">{sh.profiles?.name || "Unknown"}</h4>
                    <p className="text-xs text-gray-500">Unit: {sh.unit_flat} | {sh.profiles?.email || "No email"}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={isAddingMember}
                    className="bg-[#0F766E] hover:bg-teal-800"
                    onClick={() => handleAddMember(sh.id, sh.user_id)}
                  >
                    Add
                  </Button>
                </div>
              ))
            ) : (
               <div className="text-center py-6 text-gray-500 text-sm">
                 No eligible shareholders found to add.
               </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
