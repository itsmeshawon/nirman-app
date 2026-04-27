"use client"

import { useState } from "react"
import { Calendar, CreditCard, History, Plus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScheduleTab } from "./tabs/ScheduleTab"
import { RecordPaymentTab } from "./tabs/RecordPaymentTab"
import { AllPaymentsTab } from "./tabs/AllPaymentsTab"
import { WaitingForApprovalTab } from "./tabs/WaitingForApprovalTab"

interface PaymentsClientProps {
  projectId: string
  scheduleItems: any[]
  payments: any[]
  shareholders: any[]
  milestones: any[]
  paymentProofs: any[]
}

export function PaymentsClient({ projectId, scheduleItems, payments, shareholders, milestones, paymentProofs }: PaymentsClientProps) {
  const [activeTab, setActiveTab] = useState("SCHEDULE")
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [allPayments, setAllPayments] = useState(payments)

  const totalScheduled = scheduleItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalCollected = allPayments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalOutstanding = totalScheduled - totalCollected

  let totalPenalties = 0
  scheduleItems.forEach(item => {
    if (item.penalties && Array.isArray(item.penalties)) {
      item.penalties.forEach((p: any) => {
        if (!p.is_waived) totalPenalties += (parseFloat(p.amount) || 0)
      })
    }
  })

  let collectionRate = 0
  if (totalScheduled > 0) collectionRate = (totalCollected / totalScheduled) * 100

  const formatBD = (num: number) =>
    num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

  const pendingProofsCount = paymentProofs.filter(p => p.status === "PENDING").length
  const scheduleCount = scheduleItems.length
  const historyCount = allPayments.length
  const proofsCount = paymentProofs.length

  const handleProofApproved = (proofId: string, payment: any) => {
    setAllPayments(prev => [payment, ...prev])
  }

  const handleProofRejected = (_: string) => {
    // proof status is updated inside WaitingForApprovalTab local state
  }

  return (
    <div className="space-y-8">

      {/* Financial Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 lg:col-span-1 border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-center">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Total Expected</p>
          <p className="text-2xl font-bold text-on-surface">৳ {formatBD(totalScheduled)}</p>
        </div>
        <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-primary-container/30 border-primary-container/50 flex flex-col justify-center">
          <p className="text-xs font-semibold text-on-primary-container uppercase tracking-widest mb-2">Total Collected</p>
          <p className="text-2xl font-bold text-on-primary-container">৳ {formatBD(totalCollected)}</p>
          <p className="text-xs font-medium text-primary mt-1">{collectionRate.toFixed(1)}% Rate</p>
        </div>
        <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-tertiary-container/30 border-tertiary-container/50 flex flex-col justify-center">
          <p className="text-xs font-semibold text-on-tertiary-container uppercase tracking-widest mb-2">Total Outstanding</p>
          <p className="text-2xl font-bold text-on-tertiary-container">৳ {formatBD(totalOutstanding)}</p>
        </div>
        <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-error-container/30 border-error-container flex flex-col justify-center">
          <p className="text-xs font-semibold text-on-error-container uppercase tracking-widest mb-2">Active Penalties</p>
          <p className="text-2xl font-bold text-on-error-container">৳ {formatBD(totalPenalties)}</p>
          <p className="text-xs font-medium text-destructive mt-1">From delays</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setShowCollectionModal(true)}
          className="border-outline-variant text-on-surface hover:bg-surface-variant hover:text-on-surface"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Collection
        </Button>
        <Button
          onClick={() => setShowRecordModal(true)}
          className="bg-primary hover:bg-primary"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant/40">
        <nav className="flex space-x-6 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab("SCHEDULE")}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "SCHEDULE" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"}`}
          >
            <Calendar className="w-4 h-4" /> Collection Schedule
            {scheduleCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${activeTab === "SCHEDULE" ? "bg-primary text-white" : "bg-surface-variant text-on-surface-variant"}`}>
                {scheduleCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "HISTORY" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"}`}
          >
            <History className="w-4 h-4" /> Payment History
            {historyCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${activeTab === "HISTORY" ? "bg-primary text-white" : "bg-surface-variant text-on-surface-variant"}`}>
                {historyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("WAITING")}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "WAITING" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"}`}
          >
            <Clock className="w-4 h-4" /> Waiting for Approval
            {proofsCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${activeTab === "WAITING" ? "bg-primary text-white" : pendingProofsCount > 0 ? "bg-yellow-500 text-white" : "bg-surface-variant text-on-surface-variant"}`}>
                {pendingProofsCount > 0 ? pendingProofsCount : proofsCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab panels */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 -mt-6">
        {activeTab === "SCHEDULE" && (
          <ScheduleTab
            projectId={projectId}
            scheduleItems={scheduleItems}
            payments={allPayments}
            milestones={milestones}
            shareholders={shareholders}
            createOpen={showCollectionModal}
            onCreateOpenChange={setShowCollectionModal}
          />
        )}
        {activeTab === "HISTORY" && <AllPaymentsTab projectId={projectId} payments={allPayments} />}
        {activeTab === "WAITING" && (
          <WaitingForApprovalTab
            projectId={projectId}
            proofs={paymentProofs}
            onProofApproved={handleProofApproved}
            onProofRejected={handleProofRejected}
          />
        )}
      </div>

      {/* Record Payment modal */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-on-surface">Record New Payment</DialogTitle>
          </DialogHeader>
          <RecordPaymentTab
            projectId={projectId}
            scheduleItems={scheduleItems}
            shareholders={shareholders}
            payments={allPayments}
            onSuccess={() => setShowRecordModal(false)}
          />
        </DialogContent>
      </Dialog>

    </div>
  )
}
