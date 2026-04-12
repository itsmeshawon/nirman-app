import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"

const DEFAULT_CATEGORIES = [
  "Materials", "Labor", "Equipment", "Transport",
  "Professional Fees", "Utilities", "Miscellaneous",
]

const createProjectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  address: z.string().optional(),
  area: z.string().optional(),
  start_date: z.string().optional(),
  expected_handover: z.string().optional(),
  status: z.enum(["PILOT", "ACTIVE"]).default("PILOT"),
  floors: z.number().int().min(1).optional(),
  units: z.number().int().min(1).optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch projects with shareholder counts via a join
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*, shareholders(id)")
      .order("created_at", { ascending: false })

    if (error) throw error

    const result = (projects ?? []).map((p) => ({
      ...p,
      shareholderCount: Array.isArray(p.shareholders) ? p.shareholders.length : 0,
      shareholders: undefined,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error("[GET /api/projects]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createProjectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, address, area, start_date, expected_handover, status, floors, units } = parsed.data

    const building_meta: Record<string, number> = {}
    if (floors) building_meta.floors = floors
    if (units) building_meta.units = units

    // Create the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .insert({
        name,
        address: address ?? null,
        area: area ?? null,
        start_date: start_date ?? null,
        expected_handover: expected_handover ?? null,
        status,
        building_meta: Object.keys(building_meta).length > 0 ? building_meta : null,
      })
      .select()
      .single()

    if (projectError || !project) throw projectError

    // Create default expense categories
    const categories = DEFAULT_CATEGORIES.map((catName) => ({
      project_id: project.id,
      name: catName,
    }))
    await supabaseAdmin.from("expense_categories").insert(categories)

    // Create default approval config
    await supabaseAdmin.from("approval_configs").insert({
      project_id: project.id,
      rule: "MAJORITY",
    })

    // Audit log
    await logAction({
      userId: user.id,
      action: "CREATE",
      entityType: "project",
      entityId: project.id,
      details: { name },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    console.error("[POST /api/projects]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
