"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Crown, Mail, Phone, MapPin } from "lucide-react"
import { usePageTitle } from "@/context/PageTitleContext"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/EmptyState"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

interface ShareholdersListProps {
  data: any[]
  committeeShareholderIds: string[]
}

export function ShareholdersList({ data, committeeShareholderIds }: ShareholdersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedShareholder, setSelectedShareholder] = useState<any>(null)
  const committeeSet = new Set(committeeShareholderIds)
  const { setPageTitleSuffix } = usePageTitle()

  useEffect(() => {
    setPageTitleSuffix(`(${data.length})`)
    return () => setPageTitleSuffix(null)
  }, [data.length])

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      const searchStr = `${profile?.name} ${profile?.email} ${profile?.phone} ${item.unit_flat}`.toLowerCase()
      return searchStr.includes(searchTerm.toLowerCase())
    })
  }, [data, searchTerm])

  const getProfile = (row: any) => {
    if (!row?.profiles) return null
    return Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="py-4 pr-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <Input
              placeholder="Search by name, email or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-full border border-outline-variant/40 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((item) => {
                const profile = getProfile(item)
                const isCommittee = committeeSet.has(item.id)

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedShareholder(item)}
                        className="flex items-center gap-1.5 font-medium text-on-surface hover:text-primary transition-colors text-left group"
                      >
                        {isCommittee && (
                          <span title="Committee Member">
                            <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        <span className="group-hover:underline underline-offset-2">{profile?.name}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="text-on-surface-variant">{profile?.phone || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-on-surface-variant">{profile?.email || "—"}</div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-auto p-0 border-0">
                  <EmptyState
                    icon={Crown}
                    title="No shareholders found"
                    description="No shareholders match your search criteria."
                    className="border-0 rounded-none"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Shareholder Detail Sheet */}
      <Sheet open={!!selectedShareholder} onOpenChange={(open) => { if (!open) setSelectedShareholder(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          {selectedShareholder && (() => {
            const profile = getProfile(selectedShareholder)
            const isCommittee = committeeSet.has(selectedShareholder.id)
            const initials = profile?.name
              ? profile.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
              : "?"
            return (
              <>
                {/* Profile Header */}
                <div className="px-6 pt-8 pb-5 border-b border-outline-variant/40">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary-container/30 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-on-surface leading-tight">{profile?.name || "—"}</h2>
                        {isCommittee && (
                          <span title="Committee Member" className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            <Crown className="h-3 w-3" /> Committee
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant mt-0.5">Unit {selectedShareholder.unit_flat || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">
                  {/* Contact */}
                  <section>
                    <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">Contact</h3>
                    <div className="space-y-3">
                      <DetailRow icon={<Mail className="h-4 w-4 text-on-surface-variant" />} label="Email" value={profile?.email} />
                      <DetailRow icon={<Phone className="h-4 w-4 text-on-surface-variant" />} label="Phone" value={profile?.phone} />
                      <DetailRow icon={<Phone className="h-4 w-4 text-on-surface-variant" />} label="WhatsApp" value={profile?.whatsapp_no} />
                      <DetailRow icon={<MapPin className="h-4 w-4 text-on-surface-variant" />} label="Present Address" value={profile?.present_address} />
                    </div>
                  </section>

                  <div className="border-t border-outline-variant/40" />

                  {/* Professional */}
                  {(profile?.profession || profile?.designation || profile?.organization) && (
                    <>
                      <section>
                        <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">Professional</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <StatField label="Profession" value={profile?.profession} />
                          <StatField label="Designation" value={profile?.designation} />
                          <StatField label="Organization" value={profile?.organization} className="col-span-2" />
                        </div>
                      </section>

                      <div className="border-t border-outline-variant/40" />
                    </>
                  )}

                  {/* Shareholder Info */}
                  <section>
                    <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">Shareholding</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <StatField label="Unit / Flat" value={selectedShareholder.unit_flat} />
                      <StatField label="Ownership" value={selectedShareholder.ownership_pct != null ? `${selectedShareholder.ownership_pct}%` : undefined} />
                      <StatField label="Status" value={selectedShareholder.status} />
                    </div>
                  </section>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm text-on-surface font-medium break-words">{value}</p>
      </div>
    </div>
  )
}

function StatField({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  if (!value) return null
  return (
    <div className={className}>
      <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-on-surface">{value}</p>
    </div>
  )
}
