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

// Realistic Bengali Names
const BENGALI_NAMES = [
  "Abdur Rahim", "Fatema Begum", "Tariq Ahmed", "Nasreen Akter", "Jamal Uddin",
  "Runa Laila", "Mahmudul Hasan", "Selina Hossain", "Anwar Ali", "Khaleda Zia",
  "Mustafa Kamal", "Rokeya Sakhawat", "Humayun Azad", "Begum Sufia", "Zulfiqar Ali",
  "Sayed Ahmed", "Jahanara Imam", "Mofizur Rahman", "Farhana Islam", "Kamrul Hassan"
]

const SH_EMAILS = BENGALI_NAMES.map((name, i) => ({
  email: `shareholder${i + 1}@nirman.app`,
  name,
  unit: `${Math.floor(i / 2) + 1}${i % 2 === 0 ? 'A' : 'B'}`
}))

const USERS = [
  { email: "admin@nirman.app", name: "Super Admin", role: "SUPER_ADMIN" },
  { email: "kamal@greenvalley.com", name: "Kamal Hossain", role: "PROJECT_ADMIN" },
  ...SH_EMAILS.map(s => ({ ...s, role: "SHAREHOLDER" }))
]

async function createOrGetUser(email: string, name: string, role: string): Promise<string> {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const existing = list?.users.find((u) => u.email === email)
  if (existing) return existing.id

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) throw error
  return data.user.id
}

async function upsertProfile(id: string, name: string, role: string) {
  const { error } = await supabase.from("profiles").upsert(
    { id, name, role },
    { onConflict: "id" }
  )
  if (error) console.warn(`  ⚠️  Profile upsert for ${name}:`, error.message)
}

async function main() {
  console.log("\n🌱 Starting NirmaN Pilot Seed...\n")

  // 1. Create Users
  console.log("👤 Creating 22 users...")
  const userIds: Record<string, string> = {}
  for (const u of USERS) {
    const id = await createOrGetUser(u.email, u.name, u.role)
    userIds[u.email] = id
    await upsertProfile(id, u.name, u.role)
  }

  // 2. Create Project
  console.log("\n🏗️  Creating project: Green Valley Heights...")
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .upsert({
      name: "Green Valley Heights",
      address: "Bashundhara R/A, Block-G, Dhaka",
      status: "ACTIVE",
    }, { onConflict: "name" })
    .select("id")
    .single()

  if (pErr || !project) throw new Error(`Project error: ${pErr?.message}`)
  const projectId = project.id

  // 3. Link Admin
  const kamalId = userIds["kamal@greenvalley.com"]
  await supabase.from("project_admins").upsert({ project_id: projectId, user_id: kamalId }, { onConflict: "project_id,user_id" })

  // 4. Create Shareholders
  console.log("\n👥 Creating 20 shareholders...")
  const shareholderIds: Record<string, string> = {}
  for (const s of SH_EMAILS) {
    const userId = userIds[s.email]
    const { data: sh } = await supabase
      .from("shareholders")
      .upsert({ 
        project_id: projectId, 
        user_id: userId, 
        unit_flat: s.unit,
        ownership_pct: 100 / SH_EMAILS.length,
        status: "ACTIVE"
      }, { onConflict: "project_id,user_id" })
      .select("id")
      .single()
    if (sh) shareholderIds[s.email] = sh.id
  }

  // 5. Committee Members (Top 3)
  const committee = SH_EMAILS.slice(0, 3)
  for (const s of committee) {
    await supabase.from("committee_members").upsert({
      project_id: projectId,
      user_id: userIds[s.email],
      shareholder_id: shareholderIds[s.email],
      is_active: true
    }, { onConflict: "project_id,user_id" })
  }

  // 6. Expense Categories
  console.log("\n📂 Creating expense categories...")
  const categories = ["Materials", "Labor", "Equipment", "Legal & Permits", "Architectural", "Utilities"]
  const categoryIds: Record<string, string> = {}
  for (const name of categories) {
    const { data: cat } = await supabase.from("expense_categories").upsert({ project_id: projectId, name }, { onConflict: "project_id,name" }).select("id").single()
    if (cat) categoryIds[name] = cat.id
  }

  // 7. Milestones
  console.log("\n🏁 Creating milestones...")
  const milestones = [
    { name: "Piling & Foundation", status: "COMPLETED", sort_order: 1 },
    { name: "Basement & Ground Floor", status: "IN_PROGRESS", sort_order: 2 },
    { name: "1st - 3rd Floor Slab", status: "UPCOMING", sort_order: 3 },
    { name: "Finishing & Interior", status: "UPCOMING", sort_order: 4 }
  ]
  const milestoneIds: Record<string, string> = {}
  for (const m of milestones) {
    const { data: mile } = await supabase.from("milestones").upsert({ project_id: projectId, ...m }, { onConflict: "project_id,name" }).select("id").single()
    if (mile) milestoneIds[m.name] = mile.id
  }

  // 8. Expense Pipeline
  console.log("\n💰 Seeding expense pipeline...")
  const expenses = [
    { title: "Cement Procurement (2000 bags)", amount: 1200000, status: "PUBLISHED", cat: "Materials", m: "Piling & Foundation" },
    { title: "Reinforcement Steel (40 tons)", amount: 3500000, status: "PUBLISHED", cat: "Materials", m: "Piling & Foundation" },
    { title: "Excavation Labor", amount: 450000, status: "PUBLISHED", cat: "Labor", m: "Piling & Foundation" },
    { title: "Foundation Casting Labor", amount: 250000, status: "APPROVED", cat: "Labor", m: "Basement & Ground Floor" },
    { title: "Bricks for Basement", amount: 800000, status: "SUBMITTED", cat: "Materials", m: "Basement & Ground Floor" },
    { title: "Legal Consultant Fee", amount: 50000, status: "DRAFT", cat: "Legal & Permits", m: "Piling & Foundation" }
  ]
  for (const e of expenses) {
    await supabase.from("expenses").insert({
      project_id: projectId,
      title: e.title,
      amount: e.amount,
      status: e.status,
      category_id: categoryIds[e.cat],
      milestone_id: milestoneIds[e.m],
      date: new Date().toISOString(),
      created_by_id: userIds["kamal@greenvalley.com"]
    })
  }

  // 9. Payment Schedules & Payments
  console.log("\n💳 Seeding payments & schedules...")
  for (const [email, shId] of Object.entries(shareholderIds)) {
    // Each shareholder has 2 installments so far
    const sched1 = await supabase.from("schedule_items").insert({
      shareholder_id: shId,
      milestone_id: milestoneIds["Piling & Foundation"],
      amount: 500000,
      due_date: "2026-01-15",
      status: "PAID",
      project_id: projectId
    }).select("id").single()

    if (sched1.data) {
      await supabase.from("payments").insert({
        shareholder_id: shId,
        schedule_item_id: sched1.data.id,
        amount: 500000,
        method: "BANK_TRANSFER",
        receipt_no: `NRM-SEED-2601-${shId.slice(0,4)}`,
        recorded_by_id: userIds["kamal@greenvalley.com"]
      })
    }

    const { data: sched2 } = await supabase.from("schedule_items").insert({
      shareholder_id: shId,
      milestone_id: milestoneIds["Basement & Ground Floor"],
      amount: 300000,
      due_date: "2026-03-20",
      status: Math.random() > 0.3 ? "PAID" : "OVERDUE",
      project_id: projectId
    }).select("id").single()

    if (sched2 && sched2.status === "PAID") {
      await supabase.from("payments").insert({
        shareholder_id: shId,
        schedule_item_id: sched2.id,
        amount: 300000,
        method: "BKASH",
        receipt_no: `NRM-SEED-2603-${shId.slice(0,4)}`,
        recorded_by_id: userIds["kamal@greenvalley.com"]
      })
    }
  }

  // 10. Documents
  console.log("\n📄 Seeding documents...")
  const docs = [
    { name: "Land Deed - Block G", category: "Land Documents" },
    { name: "Master Floor Plan", category: "Floor Plans" },
    { name: "Electrical Wiring Dia.", category: "Electrical Drawings" },
    { name: "Soil Test Report", category: "Other" }
  ]
  for (const d of docs) {
    await supabase.from("project_documents").insert({
      project_id: projectId,
      name: d.name,
      category: d.category,
      file_path: `seed/${d.name.replace(/\s+/g, '_')}.pdf`,
      file_type: "application/pdf"
    })
  }

  console.log("\n✅ Pilot Seed Complete!")
  console.log("Admin: kamal@greenvalley.com / test1234")
  console.log("Shareholders: shareholder1@nirman.app to shareholder20@nirman.app / test1234")
}

main().catch(e => console.error("❌ Seed failed:", e))
