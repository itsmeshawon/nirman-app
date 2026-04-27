"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileText, FileDown, Upload, Clock, Paperclip } from "lucide-react"
import { SubmitPaymentProofModal } from "./SubmitPaymentProofModal"

interface ShareholderPaymentsClientProps {
  scheduleItems: any[]
  payments: any[]
  shareholder: any
  myProofs: any[]
}

export function ShareholderPaymentsClient({ scheduleItems, payments, shareholder, myProofs: initialProofs }: ShareholderPaymentsClientProps) {
  const [activeTab, setActiveTab] = useState("SCHEDULE")
  const [showProofModal, setShowProofModal] = useState(false)
  const [proofs, setProofs] = useState(initialProofs)

  const totalScheduled = scheduleItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalPaid = payments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalDue = totalScheduled - totalPaid

  let totalPenalties = 0
  scheduleItems.forEach(item => {
    if (item.penalties && Array.isArray(item.penalties)) {
      item.penalties.forEach((p: any) => {
        if (!p.is_waived) totalPenalties += (parseFloat(p.amount) || 0)
      })
    }
  })

  const upcomingItems = scheduleItems.filter(s => s.status === 'DUE' || s.status === 'UPCOMING').sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const nextPayment = upcomingItems[0]

  const visibleProofs = proofs.filter(p => p.status !== "APPROVED")
  const pendingProofsCount = proofs.filter(p => p.status === "PENDING").length
  const scheduleCount = scheduleItems.length
  const historyCount = payments.length

  const formatBD = (num: number) => num.toLocaleString('en-IN')

  const statusConfig: Record<string, string> = {
    UPCOMING: "bg-surface-variant/50 text-on-surface",
    DUE: "bg-tertiary-container/50 text-tertiary",
    OVERDUE: "bg-error-container/50 text-destructive",
    PAID: "bg-primary-container/50 text-primary",
    PARTIALLY_PAID: "bg-yellow-100 text-on-tertiary-container"
  }

  const proofStatusConfig: Record<string, { label: string; style: string }> = {
    PENDING: { label: "Pending Review", style: "bg-yellow-100 text-yellow-800" },
    APPROVED: { label: "Approved", style: "bg-primary-container/50 text-primary" },
    REJECTED: { label: "Rejected", style: "bg-error-container/50 text-destructive" },
  }

  const handleDownloadReceipt = (paymentId: string) => {
    window.open(`/${shareholder.project_id}/payments/${paymentId}/receipt`, "_blank")
  }

  const handleProofSubmitted = (newProof: any) => {
    setProofs(prev => [newProof, ...prev])
  }

  return (
    <div className="space-y-8">

      <div className="flex justify-end items-end gap-3">
        <Button
          onClick={() => setShowProofModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Upload className="w-4 h-4 mr-2" /> Submit Payment Proof
        </Button>
        <Button onClick={() => window.open("/my/payments/statement", "_blank")} variant="outline" className="text-primary border-primary hover:bg-primary-container/20">
          <FileDown className="w-4 h-4 mr-2" /> Download Full Statement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-[1.25rem] p-5">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Total Paid</p>
          <p className="text-2xl font-bold text-primary">৳ {formatBD(totalPaid)}</p>
        </div>
        <div className="border rounded-[1.25rem] p-5">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Total Outstanding</p>
          <p className="text-2xl font-bold text-tertiary">৳ {formatBD(totalDue)}</p>
        </div>
        <div className="border rounded-[1.25rem] p-5">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Penalty Balance</p>
          <p className="text-2xl font-bold text-destructive">৳ {formatBD(totalPenalties)}</p>
        </div>
        <div className="border rounded-[1.25rem] p-5 bg-orange-50 border-orange-100">
          <p className="text-xs font-semibold text-orange-800 uppercase tracking-widest mb-2">Next Scheduled Due</p>
          <p className="text-2xl font-bold text-on-surface">
            {nextPayment ? `৳ ${formatBD(parseFloat(nextPayment.amount))}` : "None"}
          </p>
          <p className="text-xs font-medium text-orange-700 mt-1">
            {nextPayment ? `Due ${new Date(nextPayment.due_date).toLocaleDateString()}` : "Fully Paid!"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant/40">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto whitespace-nowrap pb-1">
          <button onClick={() => setActiveTab("SCHEDULE")} className={`py-4 border-b-2 font-medium text-sm transition-colors inline-flex items-center gap-2 ${activeTab === "SCHEDULE" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
            My Collection Schedule
            {scheduleCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${activeTab === "SCHEDULE" ? "bg-primary text-white" : "bg-surface-variant text-on-surface-variant"}`}>
                {scheduleCount}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab("HISTORY")} className={`py-4 border-b-2 font-medium text-sm transition-colors inline-flex items-center gap-2 ${activeTab === "HISTORY" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
            My Payment History
            {historyCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${activeTab === "HISTORY" ? "bg-primary text-white" : "bg-surface-variant text-on-surface-variant"}`}>
                {historyCount}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab("PROOFS")} className={`py-4 border-b-2 font-medium text-sm transition-colors inline-flex items-center gap-2 ${activeTab === "PROOFS" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
            <Clock className="w-4 h-4" />
            Submitted Proofs
            {visibleProofs.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${activeTab === "PROOFS" ? "bg-primary text-white" : pendingProofsCount > 0 ? "bg-yellow-500 text-white" : "bg-surface-variant text-on-surface-variant"}`}>
                {visibleProofs.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="animate-in fade-in duration-300">
        {activeTab === "SCHEDULE" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead className="text-right">Expected (৳)</TableHead>
                  <TableHead className="text-right">Paid (৳)</TableHead>
                  <TableHead className="text-right">Penalty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-on-surface-variant">No scheduled collections found</TableCell>
                  </TableRow>
                ) : (
                  scheduleItems.map((item) => {
                    const uiStyle = statusConfig[item.status] || statusConfig.UPCOMING
                    const paid = payments.filter(p => p.schedule_item_id === item.id).reduce((s, p) => s + parseFloat(p.amount), 0)
                    const pen = item.penalties?.filter((p:any) => !p.is_waived).reduce((s:number, p:any) => s + parseFloat(p.amount), 0) || 0
                    const associatedPayment = payments.find(p => p.schedule_item_id === item.id)

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm font-medium">{new Date(item.due_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm text-on-surface-variant">{item.milestone?.name || 'General'}</TableCell>
                        <TableCell className="text-right font-medium text-on-surface">{parseFloat(item.amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm text-primary">{paid.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{pen.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${uiStyle}`}>
                            {item.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {(paid > 0 && associatedPayment) ? (
                            <Button variant="ghost" size="icon" onClick={() => handleDownloadReceipt(associatedPayment.id)} className="text-primary">
                              <Download className="w-4 h-4" />
                            </Button>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === "HISTORY" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Recorded</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount (৳)</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-on-surface-variant">No payments recorded yet.</TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-on-surface">{p.receipt_no}</TableCell>
                      <TableCell className="text-sm">{p.method.replace("_", " ")}</TableCell>
                      <TableCell className="text-sm text-on-surface-variant font-mono text-xs">{p.reference_no || "N/A"}</TableCell>
                      <TableCell className="text-right font-medium text-primary">{parseFloat(p.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {p.proof?.[0]?.attachment_url
                          ? <a href={p.proof[0].attachment_url} target="_blank" rel="noopener noreferrer" title={p.proof[0].attachment_name}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-primary hover:bg-primary-container/20 transition-colors">
                              <Paperclip className="w-4 h-4" />
                            </a>
                          : <span className="text-xs text-on-surface-variant">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(p.id)} className="text-primary hover:text-on-primary-container hover:bg-primary-container/20">
                          <FileText className="w-4 h-4 mr-2" /> Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === "PROOFS" && (
          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Linked Item</TableHead>
                  <TableHead className="text-right">Amount (৳)</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rejection Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProofs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-on-surface-variant">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 opacity-40" />
                        <span className="text-sm font-medium">No proofs submitted yet.</span>
                        <span className="text-xs">Use "Submit Payment Proof" to get started.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : visibleProofs.map(proof => {
                  const cfg = proofStatusConfig[proof.status] || proofStatusConfig.PENDING
                  return (
                    <TableRow key={proof.id}>
                      <TableCell className="text-sm text-on-surface-variant whitespace-nowrap">
                        {new Date(proof.submitted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {proof.schedule_item
                          ? <>{proof.schedule_item.milestone?.name || "Installment"}<br /><span className="text-xs text-on-surface-variant">Due {new Date(proof.schedule_item.due_date).toLocaleDateString()}</span></>
                          : <span className="text-xs text-on-surface-variant italic">General</span>}
                      </TableCell>
                      <TableCell className="text-right font-bold text-on-surface">
                        ৳ {parseFloat(proof.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <a href={proof.attachment_url} target="_blank" rel="noopener noreferrer" title={proof.attachment_name}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-primary hover:bg-primary-container/20 transition-colors">
                          <Paperclip className="w-4 h-4" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full whitespace-nowrap ${cfg.style}`}>
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[180px]">
                        {proof.status === "REJECTED" && proof.rejection_note
                          ? <span>"{proof.rejection_note}"</span>
                          : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <SubmitPaymentProofModal
        open={showProofModal}
        onOpenChange={setShowProofModal}
        projectId={shareholder.project_id}
        scheduleItems={scheduleItems}
        onSuccess={handleProofSubmitted}
      />
    </div>
  )
}

