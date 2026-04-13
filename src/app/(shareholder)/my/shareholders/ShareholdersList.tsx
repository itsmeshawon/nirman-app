"use client"

import { useState, useMemo } from "react"
import { Search, Building, Phone, Mail, Crown, User, Info } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface ShareholdersListProps {
  data: any[]
  committeeShareholderIds: string[]
}

export function ShareholdersList({ data, committeeShareholderIds }: ShareholdersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedShareholder, setSelectedShareholder] = useState<any>(null)
  const committeeSet = new Set(committeeShareholderIds)

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      const searchStr = `${profile?.name} ${profile?.phone} ${item.unit_flat} ${item.project?.name}`.toLowerCase()
      return searchStr.includes(searchTerm.toLowerCase())
    })
  }, [data, searchTerm])

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white p-4 border border-gray-100 rounded-[1.25rem] shadow-eos-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search neighbors by name or unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 rounded-xl border-gray-200 focus:ring-indigo-500"
          />
        </div>
        <div className="hidden md:flex gap-2">
           <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
             {data.length} Total Shareholders
           </Badge>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-900 px-6 py-4">Name</TableHead>
              <TableHead className="font-semibold text-gray-900">Email</TableHead>
              <TableHead className="font-semibold text-gray-900">Phone</TableHead>
              <TableHead className="font-semibold text-gray-900 pr-6">Unit/Flat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20 text-gray-500">
                   No neighbors found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                const isCommittee = committeeSet.has(item.id)
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedShareholder(item)}
                        className="flex items-center gap-1.5 font-medium text-gray-900 hover:text-[#4F46E5] transition-colors text-left group"
                      >
                        {isCommittee && (
                          <span title="Committee Member">
                            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          </span>
                        )}
                        <span className="group-hover:underline underline-offset-2">{profile?.name}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {profile?.email || "—"}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {profile?.phone || "—"}
                    </TableCell>
                    <TableCell className="font-medium text-sm pr-6">
                      {item.unit_flat}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Neighbor Detail Sheet */}
      <Sheet open={!!selectedShareholder} onOpenChange={(open) => { if(!open) setSelectedShareholder(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          {selectedShareholder && (() => {
            const profile = Array.isArray(selectedShareholder.profiles) ? selectedShareholder.profiles[0] : selectedShareholder.profiles
            const isCommittee = committeeSet.has(selectedShareholder.id)
            const initials = profile?.name?.split(" ").map((n:any) => n[0]).slice(0, 2).join("").toUpperCase() || "?"
            
            return (
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-br from-indigo-700 to-indigo-500 px-6 pt-12 pb-8 text-white relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
                       {profile?.avatar_url ? (
                         <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                       ) : initials}
                    </div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                       {profile?.name}
                       {isCommittee && <Crown className="h-5 w-5 text-amber-300" />}
                    </h2>
                    <p className="text-indigo-100 text-sm opacity-80 mt-1">{selectedShareholder.project?.name}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                   <section>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Unit Details</h3>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-500 mb-1">Unit / Flat</p>
                          <p className="text-base font-bold text-slate-900">{selectedShareholder.unit_flat}</p>
                        </div>
                        <Building className="h-6 w-6 text-indigo-100" />
                      </div>
                   </section>

                   <section>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Information</h3>
                      <div className="space-y-4">
                        <ContactRow icon={<Phone className="h-4 w-4" />} label="Phone" value={profile?.phone} />
                        <ContactRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile?.email} />
                      </div>
                   </section>

                   {profile?.profession && (
                     <section>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Bio</h3>
                        <div className="space-y-3">
                           <div>
                             <p className="text-[10px] text-gray-400">Profession</p>
                             <p className="text-sm text-gray-800 font-medium">{profile.profession}</p>
                           </div>
                           {profile.organization && (
                             <div>
                               <p className="text-[10px] text-gray-400">Organization</p>
                               <p className="text-sm text-gray-800 font-medium">{profile.organization}</p>
                             </div>
                           )}
                        </div>
                     </section>
                   )}
                </div>
              </div>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
      </div>
    </div>
  )
}
