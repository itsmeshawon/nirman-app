import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    // 1. Authenticate (any project member can typically read, but checking admin for strictness based on route location)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0"))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20")))
    const from = page * limit

    const { data: milestones, error, count } = await supabase
      .from("milestones")
      .select("*", { count: "exact" })
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .range(from, from + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      milestones,
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > from + limit,
    }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    // 1. Authenticate & Authorize
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await requireProjectAdmin(supabase, projectId)
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, start_date, target_date, status, sort_order } = await request.json()

    if (!name) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error: insertError } = await supabase
      .from("milestones")
      .insert({
        project_id: projectId,
        name,
        start_date: start_date || null,
        target_date: target_date || null,
        status: status || 'UPCOMING',
        sort_order: sort_order || 0
      })
      .select()
      .single()

    if (insertError) {
      console.error("Milestone insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "CREATE_MILESTONE",
      entityType: "milestone",
      entityId: data.id,
      details: { name }
    })

    return NextResponse.json({ success: true, data }, { status: 201 })

  } catch (err: any) {
    console.error("Milestone POST err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
