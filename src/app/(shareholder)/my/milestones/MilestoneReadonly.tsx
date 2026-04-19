"use client"

import { CheckCircle2, Clock, Circle, Banknote } from "lucide-react"
import { formatBDT } from "@/lib/utils"

interface Milestone {
  id: string
  name: string
  status: string
  start_date: string | null
  target_date: string | null
  sort_order: number
}

interface ExpenseTotal {
  total: number
  count: number
}

interface MilestoneReadonlyProps {
  milestones: Milestone[]
  expenseTotals: Record<string, ExpenseTotal>
}

export function MilestoneReadonly({ milestones, expenseTotals }: MilestoneReadonlyProps) {
  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-8 rounded-[1.25rem] border border-[var(--outline-variant)]/40 bg-[var(--surface)]">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--on-surface)] tracking-tight">Project Progress Report</h2>
          <p className="text-[var(--on-surface-variant)] mt-1">Real-time status of construction phases and milestones.</p>
        </div>

        {milestones.length === 0 ? (
          <div className="text-center py-20 bg-[var(--surface-variant)]/10 rounded-2xl border border-dashed border-[var(--outline-variant)]/40">
             <div className="w-12 h-12 rounded-full bg-[var(--surface-variant)]/50 flex items-center justify-center mx-auto mb-4">
                <Circle className="w-6 h-6 text-[var(--outline-variant)]" />
             </div>
             <p className="text-[var(--on-surface-variant)] font-medium">No progress milestones have been recorded yet.</p>
             <p className="text-[var(--outline)] text-sm mt-1">Please check back later as the project admin updates the timeline.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-[var(--outline-variant)]/30 ml-4 pl-8 space-y-8 py-4">
            {milestones.map((milestone, idx) => {
              const isCompleted = milestone.status === "COMPLETED"
              const isInProgress = milestone.status === "IN_PROGRESS"
              const isUpcoming = milestone.status === "UPCOMING"

              return (
                <div key={milestone.id} className="relative group">
                  <span className={`absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full ring-8
                    ${isCompleted ? 'bg-[var(--primary-container)] ring-[var(--surface)]' : ''}
                    ${isInProgress ? 'bg-[var(--primary-container)] ring-[var(--surface)]' : ''}
                    ${isUpcoming ? 'bg-[var(--surface-variant)] border-2 border-[var(--outline)] ring-[var(--surface)]' : ''}
                  `}>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-[var(--on-primary-container)]" />}
                    {isInProgress && (
                      <div className="relative">
                        <Clock className="h-5 w-5 text-[var(--on-primary-container)] relative z-10" />
                        <div className="absolute inset-0 rounded-full bg-[var(--primary-container)] animate-ping opacity-25"></div>
                      </div>
                    )}
                    {isUpcoming && <Circle className="h-5 w-5 text-[var(--on-surface-variant)]" />}
                  </span>
                  
                  {idx !== milestones.length - 1 && (
                    <div className={`absolute top-9 -left-[27px] h-[calc(100%+3rem)] border-l-2 -z-10
                      ${isCompleted ? 'border-[var(--primary-container)]/50' : 'border-[var(--outline-variant)]/30'}
                      ${isInProgress ? 'border-dashed border-[var(--primary)]/50' : 'border-dotted'}
                    `}></div>
                  )}

                  <div className={`
                    p-5 rounded-2xl border transition-all duration-200
                    ${isCompleted ? 'bg-[var(--primary-container)]/10 border-[var(--primary-container)]/30' : ''}
                    ${isInProgress ? 'bg-[var(--primary-container)]/20 border-[var(--primary)]/50' : 'border-[var(--outline-variant)]/40'}
                    ${isUpcoming ? 'opacity-60 bg-[var(--surface-variant)]/20' : ''}
                  `}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-base font-semibold ${isUpcoming ? 'text-[var(--on-surface-variant)]' : 'text-[var(--on-surface)]'}`}>
                            {milestone.name}
                          </h3>
                          {isInProgress && (
                            <span className="flex h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          {(milestone.start_date || milestone.target_date) && (
                            <div className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)]">
                              <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Timeline:</span>
                              <span className="font-medium">
                                {milestone.start_date ? new Date(milestone.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "?"}
                                <span className="mx-1 text-[var(--outline-variant)]">→</span>
                                {milestone.target_date ? new Date(milestone.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD"}
                              </span>
                            </div>
                          )}
                          
                          {milestone.start_date && milestone.target_date && (
                            <p className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-container)]/30 px-2 py-0.5 rounded w-fit uppercase tracking-tighter">
                              Duration: {Math.ceil((new Date(milestone.target_date).getTime() - new Date(milestone.start_date).getTime()) / (1000 * 60 * 60 * 24))} Days
                            </p>
                          )}

                          {expenseTotals[milestone.id] && expenseTotals[milestone.id].count > 0 && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--on-surface-variant)] bg-[var(--surface-variant)]/40 px-2.5 py-1 rounded-lg w-fit">
                              <Banknote className="w-3.5 h-3.5 text-[var(--primary)]" />
                              <span className="font-semibold text-[var(--primary)]">{formatBDT(expenseTotals[milestone.id].total)}</span>
                              <span className="opacity-60">across {expenseTotals[milestone.id].count} expense{expenseTotals[milestone.id].count > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className={`
                          px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                          ${isCompleted ? 'bg-[var(--primary-container)]/50 text-[var(--on-primary-container)]' : ''}
                          ${isInProgress ? 'bg-[var(--tertiary-container)]/50 text-[var(--on-tertiary-container)]' : ''}
                          ${isUpcoming ? 'bg-[var(--surface-variant)]/50 text-[var(--on-surface-variant)]' : ''}
                        `}>
                          {milestone.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
