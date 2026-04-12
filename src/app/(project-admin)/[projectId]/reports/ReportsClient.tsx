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
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100 hover:border-teal-400",
  },
  {
    id: "collection-summary",
    title: "Collection Summary",
    description: "Per-shareholder payment collection rates, overdue amounts and penalty totals.",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100 hover:border-blue-400",
  },
  {
    id: "defaulters",
    title: "Defaulters Report",
    description: "All overdue installments with shareholder details and days overdue.",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100 hover:border-red-400",
  },
  {
    id: "audit-log",
    title: "Audit Log Export",
    description: "Full system audit trail — actions, timestamps, entity IDs and user references.",
    icon: ClipboardList,
    color: "text-purple-600",
    bg: "bg-purple-50",
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
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1 text-sm">Download financial and operational reports as CSV files.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Scheduled", value: formatBDTShort(summary.totalScheduled), color: "text-gray-900" },
          { label: "Total Collected", value: formatBDTShort(summary.totalPaid), color: "text-teal-700" },
          { label: "Total Expenses", value: formatBDTShort(summary.totalExpenses), color: "text-purple-700" },
          { label: "Collection Rate", value: `${summary.collectionRate}%`, color: summary.collectionRate >= 80 ? "text-green-700" : "text-red-700" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-900">Collections vs Expenses by Milestone</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} />
              <YAxis tickFormatter={formatBDTShort} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: any, name: any) => [formatBDTShort(Number(value) || 0), name === "collected" ? "Collected" : "Expenses"] as [string, string]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => v === "collected" ? "Collected" : "Published Expenses"} />
              <Bar dataKey="collected" fill="#0f766e" radius={[4, 4, 0, 0]} name="collected" />
              <Bar dataKey="expenses" fill="#7c3aed" radius={[4, 4, 0, 0]} name="expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Download Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Download Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon
            const isLoading = loading === report.id
            return (
              <div
                key={report.id}
                className={`bg-white rounded-xl border ${report.border} shadow-sm p-5 flex items-start gap-4 transition-all`}
              >
                <div className={`w-11 h-11 rounded-xl ${report.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900">{report.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{report.description}</p>
                </div>
                <button
                  onClick={() => handleDownload(report.id)}
                  disabled={isLoading}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  CSV
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
