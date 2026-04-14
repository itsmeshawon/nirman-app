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
      <div className="p-4 border border-outline-variant/30 rounded-[1.25rem] flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <Input
            placeholder="Search neighbors by name or unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 rounded-xl border-outline-variant/50 focus:ring-primary"
          />
        </div>
        <div className="hidden md:flex gap-2">
           <Badge variant="outline" className="bg-surface-variant/20 text-slate-600 border-slate-200">
             {data.length} Total Shareholders
           </Badge>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden">
        <Table>
          <TableHeader className="bg-surface-variant/20">
            <TableRow>
              <TableHead className="font-semibold text-on-surface px-6 py-4">Name</TableHead>
              <TableHead className="font-semibold text-on-surface">Email</TableHead>
              <TableHead className="font-semibold text-on-surface">Phone</TableHead>
              <TableHead className="font-semibold text-on-surface pr-6">Unit/Flat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20 text-on-surface-variant">
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
                        className="flex items-center gap-1.5 font-medium text-on-surface hover:text-primary transition-colors text-left group"
                      >
                        {isCommittee && (
                          <span title="Committee Member">
                            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          </span>
                        )}
                        <span className="group-hover:underline underline-offset-2">{profile?.name}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-on-surface-variant text-sm">
                      {profile?.email || "—"}
                    </TableCell>
                    <TableCell className="text-on-surface-variant text-sm">
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
                <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-12 pb-8 text-white relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-surface/20 border-2 border-white/30 flex items-center justify-center text-2xl font-bold mb-4">
                       {profile?.avatar_url ? (
                         <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                       ) : initials}
                    </div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                       {profile?.name}
                       {isCommittee && <Crown className="h-5 w-5 text-amber-300" />}
                    </h2>
                    <p className="text-white/80 text-sm opacity-80 mt-1">{selectedShareholder.project?.name}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                   <section>
                      <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Unit Details</h3>
                      <div className="bg-surface-variant/20 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-on-surface-variant mb-1">Unit / Flat</p>
                          <p className="text-base font-bold text-slate-900">{selectedShareholder.unit_flat}</p>
                        </div>
                        <Building className="h-6 w-6 text-primary-container/50" />
                      </div>
                   </section>

                   <section>
                      <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Contact Information</h3>
                      <div className="space-y-4">
                        <ContactRow icon={<Phone className="h-4 w-4" />} label="Phone" value={profile?.phone} />
                        <ContactRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile?.email} />
                      </div>
                   </section>

                   {profile?.profession && (
                     <section>
                        <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Bio</h3>
                        <div className="space-y-3">
                           <div>
                             <p className="text-[10px] text-outline">Profession</p>
                             <p className="text-sm text-on-surface font-medium">{profile.profession}</p>
                           </div>
                           {profile.organization && (
                             <div>
                               <p className="text-[10px] text-outline">Organization</p>
                               <p className="text-sm text-on-surface font-medium">{profile.organization}</p>
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
      <div className="w-8 h-8 rounded-lg bg-primary-container/30 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-outline">{label}</p>
        <p className="text-sm font-semibold text-on-surface">{value || "—"}</p>
      </div>
    </div>
  )
}
