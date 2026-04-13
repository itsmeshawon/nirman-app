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
      <div className="bg-white p-6 sm:p-8 rounded-[1.25rem] border shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Project Progress Report</h2>
          <p className="text-gray-500 mt-1">Real-time status of construction phases and milestones.</p>
        </div>

        {milestones.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
             <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Circle className="w-6 h-6 text-slate-300" />
             </div>
             <p className="text-gray-500 font-medium font-medium">No progress milestones have been recorded yet.</p>
             <p className="text-slate-400 text-sm mt-1">Please check back later as the project admin updates the timeline.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-gray-100 ml-4 pl-8 space-y-12 py-4">
            {milestones.map((milestone, idx) => {
              const isCompleted = milestone.status === "COMPLETED"
              const isInProgress = milestone.status === "IN_PROGRESS"
              const isUpcoming = milestone.status === "UPCOMING"

              return (
                <div key={milestone.id} className="relative group">
                  {/* Timeline Node */}
                  <span className="absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full bg-white ring-8 ring-white">
                    {isCompleted && (
                      <div className="bg-green-500 rounded-full p-1.5 shadow-sm shadow-green-100">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    {isInProgress && (
                      <div className="relative">
                        <div className="bg-indigo-600 rounded-full p-1.5 shadow-lg shadow-indigo-100 relative z-10">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-25"></div>
                      </div>
                    )}
                    {isUpcoming && (
                      <div className="bg-white border-2 border-gray-200 rounded-full p-1.5">
                        <Circle className="h-5 w-5 text-gray-200" />
                      </div>
                    )}
                  </span>
                  
                  {/* Vertical Connector Logic (different styles between nodes) */}
                  {idx !== milestones.length - 1 && (
                    <div className={`absolute top-9 -left-[27px] h-[calc(100%+3rem)] border-l-2 -z-10
                      ${isCompleted ? 'border-green-100' : 'border-slate-100'}
                      ${isInProgress ? 'border-dashed border-indigo-200' : ''}
                      ${isUpcoming ? 'border-dotted border-gray-100' : ''}
                    `}></div>
                  )}

                  {/* Content Card */}
                  <div className={`
                    p-5 rounded-2xl border transition-all duration-300
                    ${isCompleted ? 'bg-white border-green-50 shadow-sm' : ''}
                    ${isInProgress ? 'bg-indigo-50/30 border-indigo-100 shadow-md transform scale-[1.02]' : 'bg-white border-slate-100'}
                    ${isUpcoming ? 'opacity-70 bg-gray-50/50 border-gray-100' : ''}
                  `}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-lg font-bold tracking-tight ${isUpcoming ? 'text-gray-500' : 'text-gray-900'}`}>
                            {milestone.name}
                          </h3>
                          {isInProgress && (
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1 mt-1">
                          {(milestone.start_date || milestone.target_date) && (
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                              <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Timeline:</span>
                              <span>
                                {milestone.start_date ? new Date(milestone.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "?"}
                                <span className="mx-1 text-gray-300">→</span>
                                {milestone.target_date ? new Date(milestone.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD"}
                              </span>
                            </div>
                          )}
                          
                          {milestone.start_date && milestone.target_date && (
                            <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit uppercase tracking-tighter">
                              Duration: {Math.ceil((new Date(milestone.target_date).getTime() - new Date(milestone.start_date).getTime()) / (1000 * 60 * 60 * 24))} Days
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <span className={`
                          px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                          ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                          ${isInProgress ? 'bg-indigo-100 text-indigo-700' : ''}
                          ${isUpcoming ? 'bg-slate-100 text-slate-500' : ''}
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
