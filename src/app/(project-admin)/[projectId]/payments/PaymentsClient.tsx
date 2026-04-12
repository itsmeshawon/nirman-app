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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Financial Collections & Payments</h1>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
           {/* Primary Cards */}
           <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-white shadow-sm flex flex-col justify-center">
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Total Expected</p>
             <p className="text-2xl font-bold text-gray-900">৳ {formatBD(totalScheduled)}</p>
           </div>
           
           <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-teal-50 border-teal-100 shadow-sm flex flex-col justify-center">
             <p className="text-xs font-semibold text-teal-800 uppercase tracking-widest mb-2">Total Collected</p>
             <p className="text-2xl font-bold text-teal-900">৳ {formatBD(totalCollected)}</p>
             <p className="text-xs font-medium text-teal-700 mt-1">{collectionRate.toFixed(1)}% Rate</p>
           </div>
           
           <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-blue-50 border-blue-100 shadow-sm flex flex-col justify-center">
             <p className="text-xs font-semibold text-blue-800 uppercase tracking-widest mb-2">Total Outstanding</p>
             <p className="text-2xl font-bold text-blue-900">৳ {formatBD(totalOutstanding)}</p>
           </div>

           <div className="col-span-2 lg:col-span-1 border rounded-xl p-4 bg-red-50 border-red-100 shadow-sm flex flex-col justify-center">
             <p className="text-xs font-semibold text-red-800 uppercase tracking-widest mb-2">Active Penalties</p>
             <p className="text-2xl font-bold text-red-900">৳ {formatBD(totalPenalties)}</p>
             <p className="text-xs font-medium text-red-700 mt-1">From delays</p>
           </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
         <nav className="flex space-x-8">
            <button
               onClick={() => setActiveTab("SCHEDULE")}
               className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "SCHEDULE" ? "border-[#0F766E] text-[#0F766E]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
               <Calendar className="w-4 h-4" /> Collection Schedule
            </button>
            <button
               onClick={() => setActiveTab("RECORD")}
               className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "RECORD" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
               <CreditCard className="w-4 h-4" /> Record Payment
            </button>
            <button
               onClick={() => setActiveTab("DEFAULTERS")}
               className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "DEFAULTERS" ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
               <AlertTriangle className="w-4 h-4" /> Defaulters
            </button>
            <button
               onClick={() => setActiveTab("HISTORY")}
               className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "HISTORY" ? "border-[#0F766E] text-[#0F766E]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
               <History className="w-4 h-4" /> Payment History
            </button>
         </nav>
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
         {activeTab === "SCHEDULE" && <ScheduleTab projectId={projectId} scheduleItems={scheduleItems} payments={payments} milestones={milestones} shareholders={shareholders} />}
         {activeTab === "RECORD" && <RecordPaymentTab projectId={projectId} scheduleItems={scheduleItems} shareholders={shareholders} />}
         {activeTab === "DEFAULTERS" && <DefaultersTab projectId={projectId} scheduleItems={scheduleItems} payments={payments} />}
         {activeTab === "HISTORY" && <AllPaymentsTab projectId={projectId} payments={payments} />}
      </div>

    </div>
  )
}
