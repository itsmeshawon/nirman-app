import { createClient } from "@/lib/supabase/server"
import { MilestoneTimeline } from "./MilestoneTimeline"

export const dynamic = "force-dynamic"

export default async function MilestonesPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;

  const {
    projectId
  } = params;

  const supabase = await createClient()

  // Fetch milestones
  const { data: milestones, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching milestones:", error)
    return <div>Failed to load milestones</div>
  }

  return (
    <div className="w-full">
      <MilestoneTimeline projectId={projectId} initialMilestones={milestones || []} />
    </div>
  )
}
