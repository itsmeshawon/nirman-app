"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, Users, AlertTriangle, ClipboardList, BarChart2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface ReportsClientProps {
  projectId: string
  chartData: Array<{ name: string; collected: number; expenses: number }>
  summary: {
    totalScheduled: number
    totalPaid: number
    totalExpenses: number
    collectionRate: number
  }
}

const reportTypes = [
  {
    id: "expense-ledger",
    title: "Expense Ledger",
    description: "All published expenses with categories, amounts, VAT and invoice numbers.",
    icon: FileSpreadsheet,
    color: "text-primary",
    bg: "bg-primary-container/20",
    border: "border-primary-container/40 hover:border-primary/60",
  },
  {
    id: "collection-summary",
    title: "Collection Summary",
    description: "Per-shareholder payment collection rates, overdue amounts and penalty totals.",
    icon: Users,
    color: "text-tertiary",
    bg: "bg-tertiary-container/20",
    border: "border-blue-100 hover:border-blue-400",
  },
  {
    id: "defaulters",
    title: "Defaulters Report",
    description: "All overdue installments with shareholder details and days overdue.",
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-error-container/20",
    border: "border-red-100 hover:border-red-400",
  },
  {
    id: "audit-log",
    title: "Audit Log Export",
    description: "Full system audit trail — actions, timestamps, entity IDs and user references.",
    icon: ClipboardList,
    color: "text-secondary",
    bg: "bg-secondary-container/20",
    border: "border-purple-100 hover:border-purple-400",
  },
]

export function ReportsClient({ projectId, chartData, summary }: ReportsClientProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleDownload = async (reportId: string) => {
    setLoading(reportId)
    try {
      const res = await fetch(`/api/projects/${projectId}/reports/${reportId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Download failed")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportId}-${projectId.slice(0, 8)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Report downloaded.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  const formatBDTShort = (value: number) => {
    if (value >= 10000000) return `৳${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `৳${(value / 100000).toFixed(1)}L`
    if (value >= 1000) return `৳${(value / 1000).toFixed(0)}K`
    return `৳${value}`
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Reports</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Download financial and operational reports as CSV files.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Scheduled", value: formatBDTShort(summary.totalScheduled), color: "text-on-surface" },
          { label: "Total Collected", value: formatBDTShort(summary.totalPaid), color: "text-primary" },
          { label: "Total Expenses", value: formatBDTShort(summary.totalExpenses), color: "text-secondary" },
          { label: "Collection Rate", value: `${summary.collectionRate}%`, color: summary.collectionRate >= 80 ? "text-emerald-700" : "text-rose-700" },
        ].map(s => (
          <div key={s.label} className="rounded-[1.25rem] border border-outline-variant/30 p-5 transition-all duration-300">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5">{s.label}</p>
            <p className={`text-2xl font-black tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="rounded-[1.25rem] border border-outline-variant/30 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-bold text-on-surface">Collections vs Expenses</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                tickFormatter={formatBDTShort} 
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip
                formatter={(value: any, name: any) => [formatBDTShort(Number(value) || 0), name === "collected" ? "Collected" : "Expenses"] as [string, string]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #E7E0EC", fontSize: 12 }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 500 }} 
                formatter={(v) => v === "collected" ? "Collected" : "Expenses"}
                iconType="circle"
              />
              <Bar dataKey="collected" fill="#4f46e5" radius={[6, 6, 0, 0]} name="collected" barSize={32} />
              <Bar dataKey="expenses" fill="#c084fc" radius={[6, 6, 0, 0]} name="expenses" barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Download Cards */}
      <div>
        <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-4">Download Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {reportTypes.map((report) => {
            const Icon = report.icon
            const isLoading = loading === report.id
            return (
              <div
                key={report.id}
                className={`rounded-[1.25rem] border border-primary-container/30/50 p-6 flex items-start gap-4 transition-all`}
              >
                <div className={`w-12 h-12 rounded-xl ${report.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-on-surface">{report.title}</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed font-medium">{report.description}</p>
                </div>
                <button
                  onClick={() => handleDownload(report.id)}
                  disabled={isLoading}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4f46e5]/5 hover:bg-[#4f46e5]/10 text-xs font-bold text-primary transition-colors disabled:opacity-50 border border-transparent hover:border-primary-container/40"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Export
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
