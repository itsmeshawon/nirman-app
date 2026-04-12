import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables. Make sure .env.local is configured.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = "test1234"

const USERS = [
  { email: "admin@nirman.app", name: "Nirman Admin", role: "SUPER_ADMIN" },
  { email: "kamal@greenvalley.com", name: "Kamal Hossain", role: "PROJECT_ADMIN" },
  { email: "rahim@email.com", name: "Abdur Rahim", role: "SHAREHOLDER", unit: "3A" },
  { email: "fatema@email.com", name: "Fatema Begum", role: "SHAREHOLDER", unit: "3B" },
  { email: "tariq@email.com", name: "Tariq Ahmed", role: "SHAREHOLDER", unit: "5A" },
  { email: "nasreen@email.com", name: "Nasreen Akter", role: "SHAREHOLDER", unit: "5B" },
  { email: "jamal@email.com", name: "Jamal Uddin", role: "SHAREHOLDER", unit: "7A" },
]

async function createOrGetUser(email: string, name: string, role: string): Promise<string> {
  // First check if user already exists
  const { data: list, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error(`  ❌ Failed to list users:`, listError)
    throw listError
  }

  const existing = list?.users.find((u) => u.email === email)
  if (existing) {
    console.log(`  ⚠️  User already exists: ${email} (${existing.id})`)
    return existing.id
  }

  // User doesn't exist — create them
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) {
    console.error(`  ❌ Failed to create user ${email}:`, error)
    throw error
  }

  console.log(`  ✅ Created user: ${email} (${data.user.id})`)
  return data.user.id
}

async function upsertProfile(id: string, name: string, role: string) {
  // profiles columns: id, name, role, email, phone, avatar_url, is_active
  const { error } = await supabase.from("profiles").upsert(
    { id, name, role },
    { onConflict: "id" }
  )
  if (error) console.warn(`  ⚠️  Profile upsert for ${name}:`, error.message)
}

async function main() {
  console.log("\n🌱 Starting NirmaN seed...\n")

  // ─── Create Auth Users ───────────────────────────────────────────────────
  console.log("👤 Creating users...")
  const userIds: Record<string, string> = {}

  for (const u of USERS) {
    const id = await createOrGetUser(u.email, u.name, u.role)
    userIds[u.email] = id
    await upsertProfile(id, u.name, u.role)
  }

  // ─── Create Project ───────────────────────────────────────────────────────
  console.log("\n🏗️  Creating project...")
  const { data: existingProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("name", "Green Valley Heights")
    .limit(1)

  let projectId: string

  if (existingProjects && existingProjects.length > 0) {
    projectId = existingProjects[0].id
    console.log(`  ⚠️  Project already exists (${projectId})`)
  } else {
    // projects columns: id, name, address, area, start_date, expected_handover, status, building_meta
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name: "Green Valley Heights",
        address: "Bashundhara R/A, Dhaka",
        status: "PILOT",
      })
      .select("id")
      .single()

    if (error || !project) {
      console.error("  ❌ Failed to create project:", error)
      throw new Error(`Failed to create project: ${error?.message}`)
    }
    projectId = project.id
    console.log(`  ✅ Created project: Green Valley Heights (${projectId})`)
  }

  // ─── Link Project Admin ───────────────────────────────────────────────────
  console.log("\n👔 Linking project admin...")
  const kamalId = userIds["kamal@greenvalley.com"]
  // project_admins columns: id, user_id, project_id
  const { error: adminError } = await supabase.from("project_admins").upsert(
    { project_id: projectId, user_id: kamalId },
    { onConflict: "project_id,user_id" }
  )
  if (adminError) console.warn(`  ⚠️  project_admins:`, adminError.message)
  else console.log("  ✅ Kamal linked as project admin")

  // ─── Create Shareholders ─────────────────────────────────────────────────
  console.log("\n👥 Creating shareholders...")
  const shareholderEmails = [
    { email: "rahim@email.com", unit: "3A" },
    { email: "fatema@email.com", unit: "3B" },
    { email: "tariq@email.com", unit: "5A" },
    { email: "nasreen@email.com", unit: "5B" },
    { email: "jamal@email.com", unit: "7A" },
  ]

  // shareholderIds maps email → shareholders.id (used by committee_members)
  const shareholderIds: Record<string, string> = {}

  for (const s of shareholderEmails) {
    const userId = userIds[s.email]

    const { data: existing } = await supabase
      .from("shareholders")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single()

    if (existing) {
      shareholderIds[s.email] = existing.id
      console.log(`  ⚠️  Shareholder already exists: ${s.email} (${existing.id})`)
      continue
    }

    // shareholders columns: id, user_id, project_id, unit_flat, ownership_pct, opening_balance, status
    const { data: sh, error } = await supabase
      .from("shareholders")
      .insert({ project_id: projectId, user_id: userId, unit_flat: s.unit })
      .select("id")
      .single()

    if (error || !sh) {
      console.warn(`  ⚠️  Failed to create shareholder ${s.email}:`, error?.message)
    } else {
      shareholderIds[s.email] = sh.id
      console.log(`  ✅ Shareholder created: ${s.email} (Unit ${s.unit})`)
    }
  }

  // ─── Create Committee Members ────────────────────────────────────────────
  console.log("\n🏛️  Adding committee members...")
  const committeeEmails = ["rahim@email.com", "fatema@email.com"]

  for (const email of committeeEmails) {
    const userId = userIds[email]
    const shareholderId = shareholderIds[email]

    if (!shareholderId) {
      console.warn(`  ⚠️  No shareholder record found for ${email}, skipping committee insert`)
      continue
    }

    // committee_members columns: id, shareholder_id, project_id, user_id, is_active
    const { error } = await supabase.from("committee_members").upsert(
      { project_id: projectId, user_id: userId, shareholder_id: shareholderId, is_active: true },
      { onConflict: "project_id,user_id" }
    )
    if (error) console.warn(`  ⚠️  Committee member ${email}:`, error.message)
    else console.log(`  ✅ Committee member: ${email}`)
  }

  // ─── Expense Categories ───────────────────────────────────────────────────
  console.log("\n📂 Creating expense categories...")
  const categories = [
    "Materials",
    "Labor",
    "Equipment",
    "Transport",
    "Professional Fees",
    "Utilities",
    "Miscellaneous",
  ]

  for (const name of categories) {
    // expense_categories columns: id, project_id, name
    const { error } = await supabase.from("expense_categories").upsert(
      { project_id: projectId, name },
      { onConflict: "project_id,name" }
    )
    if (error) console.warn(`  ⚠️  Category "${name}":`, error.message)
    else console.log(`  ✅ Category: ${name}`)
  }

  // ─── Milestones ───────────────────────────────────────────────────────────
  console.log("\n🏁 Creating milestones...")
  const milestones = [
    { name: "Foundation", status: "COMPLETED", sort_order: 1 },
    { name: "Ground Floor", status: "IN_PROGRESS", sort_order: 2 },
    { name: "1st Floor Slab", status: "UPCOMING", sort_order: 3 },
  ]

  for (const m of milestones) {
    const { data: existing } = await supabase
      .from("milestones")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", m.name)   // column is "name" not "title"
      .single()

    if (existing) {
      console.log(`  ⚠️  Milestone already exists: ${m.name}`)
      continue
    }

    // milestones columns: id, project_id, name, sort_order, target_date, status
    const { error } = await supabase.from("milestones").insert({
      project_id: projectId,
      name: m.name,
      status: m.status,
      sort_order: m.sort_order,
    })
    if (error) console.warn(`  ⚠️  Milestone "${m.name}":`, error.message)
    else console.log(`  ✅ Milestone: ${m.name} (${m.status})`)
  }

  // ─── Approval Config ──────────────────────────────────────────────────────
  console.log("\n⚙️  Setting approval config...")
  // approval_configs columns: id, project_id, rule
  const { error: configError } = await supabase.from("approval_configs").upsert(
    { project_id: projectId, rule: "MAJORITY" },
    { onConflict: "project_id" }
  )
  if (configError) console.warn(`  ⚠️  Approval config:`, configError.message)
  else console.log("  ✅ Approval config: MAJORITY")

  // ─── Done ─────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!\n")
  console.log("Test credentials (password: test1234)")
  console.log("─────────────────────────────────────────")
  console.log("Super Admin   admin@nirman.app")
  console.log("Project Admin kamal@greenvalley.com")
  console.log("Shareholder   rahim@email.com       (Unit 3A, Committee)")
  console.log("Shareholder   fatema@email.com      (Unit 3B, Committee)")
  console.log("Shareholder   tariq@email.com       (Unit 5A)")
  console.log("Shareholder   nasreen@email.com     (Unit 5B)")
  console.log("Shareholder   jamal@email.com       (Unit 7A)")
  console.log("")
}

main().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
