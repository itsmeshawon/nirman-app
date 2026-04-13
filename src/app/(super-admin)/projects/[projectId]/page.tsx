"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  Users,
  ShieldCheck,
  MapPin,
  Calendar,
  Search,
  Layers,
  LayoutGrid,
  Crown,
  Mail,
  Phone,
} from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminProfile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  profession: string | null
  designation: string | null
  organization: string | null
  present_address: string | null
  whatsapp_no: string | null
  is_active: boolean
}

interface ShareholderProfile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  profession: string | null
  designation: string | null
  organization: string | null
  present_address: string | null
  whatsapp_no: string | null
  is_active: boolean
}

interface Shareholder {
  id: string
  user_id: string | null
  unit_flat: string | null
  ownership_pct: number | null
  opening_balance: number | null
  status: string | null
  profile: ShareholderProfile | null
}

interface CommitteeMember {
  id: string
  shareholder_id: string | null
  user_id: string | null
  is_active: boolean
  shareholder: Shareholder | null
}

interface ProjectPackage {
  id: string
  name: string
  features: string[]
  is_active: boolean
}

interface ProjectDetail {
  id: string
  name: string
  address: string | null
  area: string | null
  status: string
  start_date: string | null
  expected_handover: string | null
  building_meta: any
  created_at: string
  package_id: string | null
  package: ProjectPackage | null
}

interface ApiResponse {
  project: ProjectDetail
  admins: AdminProfile[]
  shareholders: Shareholder[]
  committeeMembers: CommitteeMember[]
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || "—"}</p>
    </div>
  )
}

function ProfileCard({ profile, badge }: { profile: AdminProfile; badge: string }) {
  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{profile.name || "—"}</h4>
          <span className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        </div>
        <div
          className={`w-3 h-3 rounded-full mt-1 ${profile.is_active ? "bg-green-400" : "bg-gray-300"}`}
          title={profile.is_active ? "Active" : "Inactive"}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" value={profile.email} />
        <Field label="Phone" value={profile.phone} />
        <Field label="WhatsApp" value={profile.whatsapp_no} />
        <Field label="Profession" value={profile.profession} />
        <Field label="Designation" value={profile.designation} />
        <Field label="Organization" value={profile.organization} />
        <div className="col-span-2">
          <Field label="Present Address" value={profile.present_address} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PILOT: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? STATUS_STYLES.ARCHIVED
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SuperAdminProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [detailShareholder, setDetailShareholder] = useState<Shareholder | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/details`)
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to load project details")
      }
      const json: ApiResponse = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <PageSkeleton />

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="h-12 w-12 text-gray-200 mb-4" />
        <p className="text-lg font-semibold text-gray-700">Failed to load project</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
    )
  }

  const { project, admins, shareholders, committeeMembers } = data

  const committeeShareholderIds = new Set(committeeMembers.map((cm) => cm.shareholder_id))

  const filteredShareholders = search.trim()
    ? shareholders.filter((sh) =>
        sh.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
        sh.unit_flat?.toLowerCase().includes(search.toLowerCase())
      )
    : shareholders

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center text-[#0F766E] shrink-0">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={project.status} />
            {project.created_at && (
              <span className="text-xs text-gray-400">
                Created {formatDate(project.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section A — Project Info                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-[#0F766E]" />
          <h2 className="text-base font-semibold text-gray-900">Project Info</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
          <Field label="Name" value={project.name} />
          <Field label="Status" value={project.status.charAt(0) + project.status.slice(1).toLowerCase()} />
          {project.package && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Package</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                  {project.package.name}
                </span>
                {project.package.features?.map((f: string) => (
                  <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {f.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
              <p className="text-sm text-gray-800 font-medium">{project.address || "—"}</p>
            </div>
          </div>
          <Field label="Area" value={project.area} />
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Start Date</p>
              <p className="text-sm text-gray-800 font-medium">
                {project.start_date ? formatDate(project.start_date) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Expected Handover</p>
              <p className="text-sm text-gray-800 font-medium">
                {project.expected_handover ? formatDate(project.expected_handover) : "TBD"}
              </p>
            </div>
          </div>
          {project.building_meta && (
            <div className="sm:col-span-2 flex items-start gap-2">
              <Layers className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Building Structure</p>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{project.building_meta?.floors ?? "—"}</p>
                    <p className="text-[11px] text-gray-400">Floors</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{project.building_meta?.units ?? "—"}</p>
                    <p className="text-[11px] text-gray-400">Units</p>
                  </div>
                  {project.building_meta?.salesperson_name && (
                    <div>
                      <p className="text-sm font-medium text-gray-800">{project.building_meta.salesperson_name}</p>
                      <p className="text-[11px] text-gray-400">Salesperson</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section B — Project Admins                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0F766E]" />
          <h2 className="text-base font-semibold text-gray-900">
            Project Admin
            <span className="ml-2 text-xs font-normal text-gray-400">({admins.length})</span>
          </h2>
        </div>
        <div className="p-5">
          {admins.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No admins assigned to this project.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {admins.map((admin) => (
                <ProfileCard key={admin.id} profile={admin} badge="Project Admin" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section C — Shareholders                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Users className="h-4 w-4 text-[#0F766E]" />
            <h2 className="text-base font-semibold text-gray-900">
              Shareholders
              <span className="ml-2 text-xs font-normal text-gray-400">({shareholders.length})</span>
            </h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or unit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {shareholders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No shareholders found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-normal normal-case text-amber-500">
                      <Crown className="h-3 w-3" /> = Committee
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Profession
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ownership %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredShareholders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No shareholders match your search.
                    </td>
                  </tr>
                ) : (
                  filteredShareholders.map((sh) => (
                    <tr key={sh.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {sh.unit_flat || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        <button
                          type="button"
                          onClick={() => setDetailShareholder(sh)}
                          className="flex items-center gap-1.5 font-medium text-gray-900 hover:text-[#0F766E] transition-colors group text-left"
                        >
                          {committeeShareholderIds.has(sh.id) && (
                            <span title="Committee Member"><Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" /></span>
                          )}
                          <span className="group-hover:underline underline-offset-2">{sh.profile?.name || "—"}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {sh.profile?.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {sh.profile?.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {sh.profile?.profession || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800 font-medium">
                        {sh.ownership_pct != null ? `${sh.ownership_pct}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {sh.status ? <StatusBadge status={sh.status} /> : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Shareholder Detail Sheet (read-only) */}
      <Sheet open={!!detailShareholder} onOpenChange={(open) => { if (!open) setDetailShareholder(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          {detailShareholder && (() => {
            const p = detailShareholder.profile
            const isCommittee = committeeShareholderIds.has(detailShareholder.id)
            const isActive = detailShareholder.status === "ACTIVE"
            const initials = p?.name
              ? p.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
              : "?"
            return (
              <>
                {/* Hero */}
                <div className="bg-gradient-to-br from-teal-700 to-teal-500 px-6 pt-10 pb-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold leading-tight">{p?.name || "—"}</h2>
                        {isCommittee && (
                          <span className="flex items-center gap-1 text-xs bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full font-medium">
                            <Crown className="h-3 w-3" /> Committee
                          </span>
                        )}
                      </div>
                      <p className="text-teal-100 text-sm mt-0.5">Unit {detailShareholder.unit_flat || "—"}</p>
                      <span className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-green-400/20 text-green-100 border border-green-400/30" : "bg-gray-400/20 text-gray-200 border border-gray-400/30"}`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Contact</h3>
                    <div className="space-y-3">
                      <SheetDetailRow icon={<Mail className="h-4 w-4 text-gray-400" />} label="Email" value={p?.email} />
                      <SheetDetailRow icon={<Phone className="h-4 w-4 text-gray-400" />} label="Phone" value={p?.phone} />
                      <SheetDetailRow icon={<Phone className="h-4 w-4 text-gray-400" />} label="WhatsApp" value={p?.whatsapp_no} />
                      <SheetDetailRow icon={<MapPin className="h-4 w-4 text-gray-400" />} label="Present Address" value={p?.present_address} />
                    </div>
                  </section>

                  <div className="border-t border-gray-100" />

                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Professional</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <SheetStatField label="Profession" value={p?.profession} />
                      <SheetStatField label="Designation" value={p?.designation} />
                      <SheetStatField label="Organization" value={p?.organization} className="col-span-2" />
                    </div>
                  </section>

                  <div className="border-t border-gray-100" />

                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Shareholding</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <SheetStatField label="Unit / Flat" value={detailShareholder.unit_flat} />
                      <SheetStatField label="Ownership" value={detailShareholder.ownership_pct != null ? `${detailShareholder.ownership_pct}%` : undefined} />
                      <SheetStatField label="Opening Balance" value={detailShareholder.opening_balance != null ? `৳${Number(detailShareholder.opening_balance).toLocaleString()}` : undefined} />
                      <SheetStatField label="Status" value={detailShareholder.status ?? undefined} />
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

function SheetDetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  )
}

function SheetStatField({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
    </div>
  )
}
