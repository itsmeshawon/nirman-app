import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MilestoneReadonly } from "./MilestoneReadonly"

export const dynamic = "force-dynamic"

export default async function ShareholderMilestonesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 1. Identify the project for this shareholder
  const { data: shareholder } = await supabase
    .from("shareholders")
    .select("project_id")
    .eq("user_id", user.id)
    .single()

  if (!shareholder) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-12 bg-surface rounded-[1.25rem] shadow-eos-sm border py-24">
         <h2 className="text-2xl font-bold text-on-surface">Project Milestones</h2>
         <p className="text-on-surface-variant mt-2">You are not registered as a shareholder in any project.</p>
      </div>
    )
  }

  // 2. Fetch all milestones for that project
  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", shareholder.project_id)
    .order("sort_order", { ascending: true })

  return (
    <div className="w-full">
      <MilestoneReadonly milestones={milestones || []} />
    </div>
  )
}
