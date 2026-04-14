"use client"

import { CheckCircle2, Clock, Circle } from "lucide-react"

interface Milestone {
  id: string
  name: string
  status: string
  start_date: string | null
  target_date: string | null
  sort_order: number
}

interface MilestoneReadonlyProps {
  milestones: Milestone[]
}

export function MilestoneReadonly({ milestones }: MilestoneReadonlyProps) {
  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-8 rounded-[1.25rem] border border-outline-variant/40">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">Project Progress Report</h2>
          <p className="text-on-surface-variant mt-1">Real-time status of construction phases and milestones.</p>
        </div>

        {milestones.length === 0 ? (
          <div className="text-center py-20 bg-surface-variant/10 rounded-2xl border border-dashed border-outline-variant/40">
             <div className="w-12 h-12 rounded-full bg-surface-variant/50 flex items-center justify-center mx-auto mb-4">
                <Circle className="w-6 h-6 text-slate-300" />
             </div>
             <p className="text-on-surface-variant font-medium font-medium">No progress milestones have been recorded yet.</p>
             <p className="text-outline text-sm mt-1">Please check back later as the project admin updates the timeline.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-outline-variant/40 ml-4 pl-8 space-y-12 py-4">
            {milestones.map((milestone, idx) => {
              const isCompleted = milestone.status === "COMPLETED"
              const isInProgress = milestone.status === "IN_PROGRESS"
              const isUpcoming = milestone.status === "UPCOMING"

              return (
                <div key={milestone.id} className="relative group">
                  {/* Timeline Node */}
                  <span className="absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full bg-surface ring-8 ring-white">
                    {isCompleted && (
                      <div className="bg-primary-container/200 rounded-full p-1.5">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    {isInProgress && (
                      <div className="relative">
                        <div className="bg-primary rounded-full p-1.5 relative z-10">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25"></div>
                      </div>
                    )}
                    {isUpcoming && (
                      <div className="bg-surface border-2 border-outline-variant/40 rounded-full p-1.5">
                        <Circle className="h-5 w-5 text-outline-variant" />
                      </div>
                    )}
                  </span>
                  
                  {/* Vertical Connector Logic (different styles between nodes) */}
                  {idx !== milestones.length - 1 && (
                    <div className={`absolute top-9 -left-[27px] h-[calc(100%+3rem)] border-l-2 -z-10
                      ${isCompleted ? 'border-primary-container/50' : 'border-outline-variant/40'}
                      ${isInProgress ? 'border-dashed border-primary-container' : ''}
                      ${isUpcoming ? 'border-dotted border-outline-variant/40' : ''}
                    `}></div>
                  )}

                  {/* Content Card */}
                  <div className={`
                    p-5 rounded-2xl border transition-all duration-300
                    ${isCompleted ? 'border-primary-container/30' : ''}
                    ${isInProgress ? 'bg-primary-container/20 border-primary-container/50 transform scale-[1.02]' : 'border-outline-variant/40'}
                    ${isUpcoming ? 'opacity-70 bg-surface-variant/30 border-outline-variant/40' : ''}
                  `}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-lg font-bold tracking-tight ${isUpcoming ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                            {milestone.name}
                          </h3>
                          {isInProgress && (
                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1 mt-1">
                          {(milestone.start_date || milestone.target_date) && (
                            <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
                              <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Timeline:</span>
                              <span>
                                {milestone.start_date ? new Date(milestone.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "?"}
                                <span className="mx-1 text-outline-variant">→</span>
                                {milestone.target_date ? new Date(milestone.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD"}
                              </span>
                            </div>
                          )}
                          
                          {milestone.start_date && milestone.target_date && (
                            <p className="text-[10px] font-bold text-primary bg-primary-container/30 px-2 py-0.5 rounded w-fit uppercase tracking-tighter">
                              Duration: {Math.ceil((new Date(milestone.target_date).getTime() - new Date(milestone.start_date).getTime()) / (1000 * 60 * 60 * 24))} Days
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <span className={`
                          px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                          ${isCompleted ? 'bg-primary-container/50 text-primary' : ''}
                          ${isInProgress ? 'bg-primary-container/50 text-primary' : ''}
                          ${isUpcoming ? 'bg-surface-variant/50 text-on-surface-variant' : ''}
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
