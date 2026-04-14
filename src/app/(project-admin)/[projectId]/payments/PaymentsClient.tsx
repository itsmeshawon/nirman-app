"use client"

import { useState } from "react"
import { Calendar, CreditCard, Users, History, AlertTriangle } from "lucide-react"
import { ScheduleTab } from "./tabs/ScheduleTab"
import { RecordPaymentTab } from "./tabs/RecordPaymentTab"
import { DefaultersTab } from "./tabs/DefaultersTab"
import { AllPaymentsTab } from "./tabs/AllPaymentsTab"

interface PaymentsClientProps {
  projectId: string
  scheduleItems: any[]
  payments: any[]
  shareholders: any[]
  milestones: any[]
}

export function PaymentsClient({ projectId, scheduleItems, payments, shareholders, milestones }: PaymentsClientProps) {
  const [activeTab, setActiveTab] = useState("SCHEDULE")

  // Calculate high-level financial overview
  const totalScheduled = scheduleItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalCollected = payments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalOutstanding = totalScheduled - totalCollected
  
  // Outstanding Penalties (Active ones only)
  let totalPenalties = 0
  scheduleItems.forEach(item => {
    if (item.penalties && Array.isArray(item.penalties)) {
      item.penalties.forEach((p: any) => {
        if (!p.is_waived) {
          totalPenalties += (parseFloat(p.amount) || 0)
        }
      })
    }
  })

  let collectionRate = 0
  if (totalScheduled > 0) {
    collectionRate = (totalCollected / totalScheduled) * 100
  }

  const formatBD = (num: number) => {
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
  }

  return (
    <div className="space-y-8">
      
      {/* Header and Financial Overview */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface mb-6">Financial Collections & Payments</h1>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
           {/* Primary Cards */}
           <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-surface shadow-sm flex flex-col justify-center">
             <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Total Expected</p>
             <p className="text-2xl font-bold text-on-surface">৳ {formatBD(totalScheduled)}</p>
           </div>

           <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-primary-container/30 border-primary-container/50 shadow-sm flex flex-col justify-center">
             <p className="text-xs font-semibold text-on-primary-container uppercase tracking-widest mb-2">Total Collected</p>
             <p className="text-2xl font-bold text-on-primary-container">৳ {formatBD(totalCollected)}</p>
             <p className="text-xs font-medium text-primary mt-1">{collectionRate.toFixed(1)}% Rate</p>
           </div>

           <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-tertiary-container/30 border-tertiary-container/50 shadow-sm flex flex-col justify-center">
             <p className="text-xs font-semibold text-on-tertiary-container uppercase tracking-widest mb-2">Total Outstanding</p>
             <p className="text-2xl font-bold text-on-tertiary-container">৳ {formatBD(totalOutstanding)}</p>
           </div>

           <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-error-container/30 border-error-container shadow-sm flex flex-col justify-center">
             <p className="text-xs font-semibold text-on-error-container uppercase tracking-widest mb-2">Active Penalties</p>
             <p className="text-2xl font-bold text-on-error-container">৳ {formatBD(totalPenalties)}</p>
             <p className="text-xs font-medium text-destructive mt-1">From delays</p>
           </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-outline-variant/50">
         <nav className="flex space-x-8">
            <button
               onClick={() => setActiveTab("SCHEDULE")}
               className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "SCHEDULE" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"}`}
            >
               <Calendar className="w-4 h-4" /> Collection Schedule
            </button>
            <button
               onClick={() => setActiveTab("RECORD")}
               className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "RECORD" ? "border-tertiary text-tertiary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"}`}
            >
               <CreditCard className="w-4 h-4" /> Record Payment
            </button>
            <button
               onClick={() => setActiveTab("DEFAULTERS")}
               className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "DEFAULTERS" ? "border-tertiary text-tertiary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"}`}
            >
               <AlertTriangle className="w-4 h-4" /> Defaulters
            </button>
            <button
               onClick={() => setActiveTab("HISTORY")}
               className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "HISTORY" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"}`}
            >
               <History className="w-4 h-4" /> Payment History
            </button>
         </nav>
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
         {activeTab === "SCHEDULE" && <ScheduleTab projectId={projectId} scheduleItems={scheduleItems} payments={payments} milestones={milestones} shareholders={shareholders} />}
         {activeTab === "RECORD" && <RecordPaymentTab projectId={projectId} scheduleItems={scheduleItems} shareholders={shareholders} payments={payments} />}
         {activeTab === "DEFAULTERS" && <DefaultersTab projectId={projectId} scheduleItems={scheduleItems} payments={payments} />}
         {activeTab === "HISTORY" && <AllPaymentsTab projectId={projectId} payments={payments} />}
      </div>

    </div>
  )
}
