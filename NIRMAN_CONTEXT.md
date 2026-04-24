# NIRMAN — AI Agent Source of Truth
> Version: 1.0 | Last Updated: April 2026
> This file is the SINGLE SOURCE OF TRUTH for the NirmaN application.
> Every AI agent MUST read this entire file before starting any task.
> Every AI agent MUST update this file after completing any task.
> For task rules, see: AGENT_RULES.md

---

## 1. PROJECT OVERVIEW

**Name:** NirmaN
**Type:** SaaS — Construction Transparency Platform
**Purpose:** Connects construction project owners, project managers, and property buyers in a single transparent platform.
**Local path:** `/Users/shawon/Desktop/personal-projects/NirmanApp/.claude/worktrees/cool-mestorf/`

### Three User Roles
| Role | DB Value | What They Do | Lands On After Login |
|------|----------|-------------|---------------------|
| Super Admin | `SUPER_ADMIN` | Manages entire platform — creates/deletes projects, assigns admins, manages packages | `/dashboard` |
| Project Admin | `PROJECT_ADMIN` | Manages one or more projects — shareholders, payments, expenses, milestones | `/:projectId/dashboard` |
| Shareholder | `SHAREHOLDER` | Read-only view — tracks payments, expenses, milestones, feed | `/my/dashboard` |
| Finance Staff | `FINANCE_STAFF` | ⚠️ NOT IMPLEMENTED — enum exists, no feature built | — |

---

## 2. TECH STACK

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router (Server Components by default) |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL) with RLS on ALL tables |
| Auth | Supabase Auth (JWT, role in profiles table) |
| UI | shadcn/ui components in `src/components/ui/` |
| Styling | Tailwind CSS + Material Design 3 custom tokens |
| Tables | TanStack React Table v8 |
| Toasts | Sonner (`toast.success()`, `toast.error()`, `toast.loading()`) |
| Icons | Lucide React |
| Font | Plus Jakarta Sans |

---

## 3. ENVIRONMENT & SUPABASE

**File:** `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://mjnuxgdyegyqsfgkssva.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Supabase Project ID:** `mjnuxgdyegyqsfgkssva`

### Three Supabase Clients

| File | Import | When to Use |
|------|--------|-------------|
| `src/lib/supabase/server.ts` | `createClient()` | Server components, API routes — respects RLS |
| `src/lib/supabase/client.ts` | `createBrowserClient()` | Client components only |
| `src/lib/supabase/admin.ts` | `supabaseAdmin` | Bypasses RLS — only after manual auth check |

**Rule:** Always verify auth first, then use `supabaseAdmin` for system-level reads/writes.

### Middleware (`src/lib/supabase/middleware.ts`)
- Runs on every request
- Refreshes Supabase session cookies
- Redirects unauthenticated users to `/login`
- Does NOT handle role-based routing (roles handled in each layout)

### Role-Based Routing (in each layout)
- `(super-admin)/layout.tsx` → checks `profile.role === 'SUPER_ADMIN'`
- `(project-admin)/[projectId]/layout.tsx` → checks `project_admins` table for user+project
- `(shareholder)/layout.tsx` → checks `profile.role === 'SHAREHOLDER'`

---

## 4. DESIGN SYSTEM (Material Design 3 — Purple/Lavender)

The app uses a custom MD3-based design system via CSS variables. Always use these tokens, never hardcode colors.

### Core Tailwind Token Classes

| Token | Light | Use For |
|-------|-------|---------|
| `bg-primary` | #6750A4 (purple) | Primary buttons, active states |
| `text-primary` | #6750A4 | Primary text, links |
| `bg-primary-container` | #EADDFF | Subtle primary backgrounds |
| `text-on-primary-container` | #21005D | Text on primary container |
| `bg-surface` | #FEFAFF | Page background |
| `text-on-surface` | #1D1B20 | Main body text |
| `bg-surface-variant` | #F7F0F5 | Cards, sidebars |
| `text-on-surface-variant` | #49454F | Secondary text |
| `bg-surface-container-low` | #F7F2FA | Slightly raised surfaces |
| `text-outline` | #79747E | Borders, placeholder text |
| `text-outline-variant` | #CAC4D0 | Subtle borders |
| `text-error` / `bg-error-container` | Red tones | Error states |
| `text-tertiary` | #7D5260 | Accent/tertiary actions |
| `bg-tertiary-container` | #FFD8E4 | Tertiary backgrounds |

### Typography Scale
```
h1: text-[28px] font-normal tracking-tight
h2: text-[22px] font-medium tracking-tight
h3: text-[16px] font-semibold
p:  text-[14px] font-normal leading-relaxed text-muted-foreground
```

### Border Radius Scale
```
rounded-sm  = 8px
rounded-md  = 12px
rounded-lg  = 16px
rounded-xl  = 28px (cards, dialogs)
rounded-full = pills
```

### Common Patterns
```tsx
// Card
<div className="p-6 rounded-[1.25rem] border border-outline-variant/40 bg-surface">

// Primary button
<Button className="bg-primary hover:bg-primary/90 text-white">

// Status badge
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-container/20 text-primary border border-primary-container">

// Section header
<h1 className="text-2xl font-bold text-on-surface">
<p className="text-sm text-on-surface-variant mt-0.5">
```

---

## 5. APP STRUCTURE

```
src/
├── app/
│   ├── (auth)/login/page.tsx                    # Login — all roles use same login
│   │
│   ├── (super-admin)/                           # SUPER_ADMIN only
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx                   # Platform stats
│   │   ├── projects/
│   │   │   ├── page.tsx                         # All projects table — create, archive, delete
│   │   │   └── [projectId]/page.tsx             # Project detail — manage admins, view shareholders
│   │   ├── admins/page.tsx                      # All platform admins
│   │   ├── packages/page.tsx                    # Subscription packages
│   │   └── profile/page.tsx
│   │
│   ├── (project-admin)/[projectId]/             # PROJECT_ADMIN only
│   │   ├── layout.tsx                           # ⚠️ Uses supabaseAdmin to fetch project
│   │   ├── dashboard/page.tsx
│   │   ├── shareholders/
│   │   │   ├── page.tsx                         # Server fetch
│   │   │   ├── ShareholdersTable.tsx            # Client: display + delete
│   │   │   └── ShareholdersForms.tsx            # Client: create/edit
│   │   ├── committee/
│   │   │   ├── page.tsx                         # ⚠️ Uses supabaseAdmin
│   │   │   └── CommitteeClient.tsx
│   │   ├── milestones/
│   │   │   ├── page.tsx
│   │   │   └── MilestoneTimeline.tsx            # ⚠️ No router.refresh() — state only
│   │   ├── payments/
│   │   │   ├── page.tsx
│   │   │   ├── PaymentsClient.tsx
│   │   │   └── tabs/AllPayments, Schedule, RecordPayment, Defaulters
│   │   ├── expenses/
│   │   │   ├── page.tsx
│   │   │   ├── ExpensesClient.tsx
│   │   │   ├── ExpenseForm.tsx
│   │   │   └── [id]/ExpenseDetailClient.tsx
│   │   ├── feed/page.tsx + FeedClient.tsx + CreatePostForm.tsx + AdminPostCard.tsx
│   │   ├── documents/page.tsx + DocumentsClient.tsx
│   │   ├── reports/page.tsx + ReportsClient.tsx
│   │   ├── defaulters/page.tsx + DefaultersClient.tsx
│   │   ├── activity-log/page.tsx + ActivityLogClient.tsx  # Search + date filter over audit_logs
│   │   ├── settings/page.tsx + ProjectSettingsClient.tsx
│   │   └── profile/page.tsx
│   │
│   ├── (shareholder)/my/                        # SHAREHOLDER only
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx                   # ⚠️ Uses supabaseAdmin for shareholder fetch
│   │   ├── feed/page.tsx                        # ⚠️ Uses supabaseAdmin for shareholder fetch
│   │   ├── payments/page.tsx + ShareholderPaymentsClient.tsx + statement/page.tsx
│   │   ├── milestones/page.tsx + MilestoneReadonly.tsx
│   │   ├── expenses/page.tsx + ShareholderExpensesClient.tsx
│   │   ├── documents/page.tsx + ShareholderDocsClient.tsx
│   │   ├── shareholders/page.tsx + ShareholdersList.tsx
│   │   ├── review/page.tsx + ReviewClient.tsx
│   │   ├── defaulters/page.tsx + DefaultersClient.tsx
│   │   └── profile/page.tsx
│   │
│   └── api/
│       ├── projects/route.ts                    # GET all projects (super admin)
│       ├── projects/[projectId]/
│       │   ├── route.ts                         # GET project | DELETE project (cascade)
│       │   ├── status/route.ts                  # PATCH status (PILOT/ACTIVE/ARCHIVED)
│       │   ├── shareholders/route.ts            # GET list | POST create-or-link
│       │   ├── shareholders/[shareholderId]/route.ts  # PATCH | DELETE
│       │   ├── admin/route.ts                   # POST assign admin
│       │   ├── admin/[adminId]/route.ts         # DELETE remove admin
│       │   ├── committee/route.ts               # POST add member
│       │   ├── committee/[memberId]/route.ts    # DELETE remove member
│       │   ├── committee/approval-rule/route.ts # PATCH change rule
│       │   ├── milestones/route.ts              # GET | POST
│       │   ├── milestones/[id]/route.ts         # PATCH | DELETE
│       │   ├── milestones/reorder/route.ts      # PATCH reorder
│       │   ├── payments/route.ts                # GET | POST
│       │   ├── payments/[id]/route.ts           # GET | DELETE
│       │   ├── expenses/route.ts                # GET | POST
│       │   ├── expenses/[id]/route.ts           # GET | PATCH | DELETE
│       │   ├── expenses/[id]/submit/route.ts    # POST → SUBMITTED
│       │   ├── expenses/[id]/approve/route.ts   # POST → committee review
│       │   ├── expenses/[id]/publish/route.ts   # POST → PUBLISHED
│       │   ├── expenses/[id]/attachments/route.ts
│       │   ├── expenses/bulk-publish/route.ts
│       │   ├── posts/route.ts                   # GET | POST
│       │   ├── posts/[id]/route.ts              # PATCH | DELETE
│       │   ├── posts/[id]/hide/route.ts
│       │   ├── posts/[id]/react/route.ts
│       │   ├── posts/[id]/view/route.ts
│       │   ├── posts/media/route.ts
│       │   ├── schedules/route.ts
│       │   ├── schedules/[id]/route.ts
│       │   ├── generate-schedule/route.ts       # ⚠️ STUB — not fully implemented
│       │   ├── documents/route.ts
│       │   ├── documents/[id]/route.ts
│       │   ├── penalties/apply/route.ts
│       │   ├── penalties/[id]/waive/route.ts
│       │   ├── penalty-config/route.ts
│       │   ├── payment-schedule/route.ts
│       │   ├── notification-config/route.ts
│       │   ├── settings/route.ts
│       │   ├── dashboard/route.ts
│       │   ├── details/route.ts
│       │   └── reports/audit-log | defaulters | expense-ledger | collection-summary
│       ├── super-admin/admins/route.ts          # GET | POST create admin
│       ├── super-admin/admins/[adminId]/route.ts # DELETE
│       ├── packages/route.ts | [id]/route.ts | [id]/status/route.ts
│       ├── profile/route.ts | avatar/route.ts
│       ├── profiles/[userId]/route.ts
│       ├── notifications/route.ts | [id]/read | read-all
│       └── dashboard/platform/route.ts
│
├── lib/
│   ├── permissions.ts      # requireRole, requireProjectAdmin, requireProjectMember, requireCommitteeMember, getProjectRole
│   ├── audit.ts            # logAction()
│   ├── notifications.ts    # createNotification()
│   ├── penalty.ts          # Penalty calculation logic
│   ├── utils.ts            # formatBDT(), formatDate(), cn()
│   └── validations.ts
│
└── components/
    ├── layouts/
    │   ├── ProjectAdminShell.tsx
    │   └── ShareholderShell.tsx
    ├── super-admin/
    │   ├── CreateProjectDialog.tsx
    │   └── CreateAdminDialog.tsx
    └── ui/                 # shadcn/ui: Button, Input, Dialog, Table, Card, Select, Label, Skeleton, Badge...
```

---

## 6. DATABASE SCHEMA

### All Tables (RLS enabled on all)

| Table | Description |
|-------|-------------|
| `profiles` | All users — id matches auth.users.id |
| `projects` | Construction projects |
| `packages` | Subscription packages linked to projects |
| `project_admins` | User ↔ Project admin link |
| `shareholders` | User ↔ Project shareholder link |
| `committee_members` | Shareholders with expense approval rights |
| `milestones` | Construction phase milestones |
| `payment_schedules` | Schedule config (MONTHLY/MILESTONE/MIXED) |
| `schedule_items` | Individual payment due items per shareholder |
| `payments` | Recorded payments |
| `penalties` | Late payment penalties per schedule_item |
| `penalty_configs` | Penalty rules per project |
| `expenses` | Project expenses (full lifecycle) |
| `expense_categories` | Expense categories per project |
| `expense_attachments` | Files attached to expenses |
| `expense_approvals` | Committee approval records per expense |
| `activity_posts` | Feed posts with optional media |
| `reactions` | Post reactions (LIKE/LOVE/APPRECIATE) |
| `post_views` | View tracking |
| `project_documents` | Project documents |
| `approval_configs` | Expense approval rule (MAJORITY/ANY_SINGLE) |
| `notification_configs` | Notification settings per project |
| `notifications` | In-app notifications |
| `audit_logs` | Full audit trail of all actions |

### 6B. FK Reference — Child Tables Without project_id

> ⚠️ These tables do NOT have a `project_id` column. Any delete, join, or filter query MUST go through the parent. This is the #1 source of silent bugs.

| Table | FK Column | Links To | How to Delete for a Project |
|-------|-----------|----------|-----------------------------|
| `reactions` | `post_id` | `activity_posts.id` | Get post IDs first → delete where `post_id IN [postIds]` |
| `post_views` | `post_id` | `activity_posts.id` | Same as reactions |
| `expense_attachments` | `expense_id` | `expenses.id` | Get expense IDs first → delete where `expense_id IN [expenseIds]` |
| `expense_approvals` | `expense_id` | `expenses.id` | Same as attachments |
| `schedule_items` | `schedule_id` | `payment_schedules.id` | Get schedule IDs first → delete where `schedule_id IN [scheduleIds]` |
| `penalties` | `schedule_item_id` | `schedule_items.id` | Get schedule IDs → get item IDs → delete where `schedule_item_id IN [itemIds]` |

All other project-related tables have a direct `project_id` column.

### Key Enums
```sql
global_role:         SUPER_ADMIN, PROJECT_ADMIN, FINANCE_STAFF, SHAREHOLDER
project_status:      PILOT, ACTIVE, ARCHIVED
shareholder_status:  ACTIVE, INACTIVE
milestone_status:    UPCOMING, IN_PROGRESS, COMPLETED
expense_status:      DRAFT, SUBMITTED, CHANGES_REQUESTED, REJECTED, APPROVED, PUBLISHED
payment_method:      CASH, BANK_TRANSFER, BKASH, NAGAD, CHEQUE
due_status:          UPCOMING, DUE, OVERDUE, PAID, PARTIALLY_PAID
schedule_type:       MONTHLY, MILESTONE, MIXED
approval_rule:       MAJORITY, ANY_SINGLE
notification_type:   PAYMENT_REMINDER, PAYMENT_OVERDUE, EXPENSE_SUBMITTED, EXPENSE_APPROVED, EXPENSE_REJECTED, EXPENSE_PUBLISHED, ACTIVITY_POST, PENALTY_APPLIED
media_type:          IMAGE, VIDEO, AUDIO
reaction_type:       LIKE, LOVE, APPRECIATE
post_status:         PUBLISHED, HIDDEN
```

---

## 7. RLS POLICIES (Complete)

### DB Functions
```sql
is_super_admin()          -- profiles.role = 'SUPER_ADMIN'
is_project_admin(pid)     -- EXISTS in project_admins
is_project_member(pid)    -- EXISTS in project_admins OR shareholders (finance_staff ref REMOVED)
is_shareholder(pid)       -- EXISTS in shareholders
is_committee_member(pid)  -- EXISTS in committee_members
```

### Policy Summary by Table

**profiles:** Users view/update own | Admins view all (JWT check) | Project admins read shareholder profiles | Super admin manages all

**projects:** Super admin manages all | Project members view (via is_project_member)

**project_admins:** Super admin manages all | Users view own assignments

**shareholders:** Project admins — explicit EXISTS subqueries for SELECT/INSERT(WITH CHECK)/UPDATE/DELETE | Shareholder views own record

**committee_members:** Project admins manage (EXISTS subquery) | Members read own record

**milestones:** Admin manages (is_project_admin) | Members view (is_project_member)

**expenses:** Admin manages all | Committee views SUBMITTED/CHANGES_REQUESTED | Shareholders view PUBLISHED only

**expense_approvals:** Committee creates | Committee views own | Admin views all

**payments:** Admin manages (via shareholders join) | Shareholder views own (via shareholders join)

**schedule_items:** Admin manages (via shareholders join) | Shareholder views own

**activity_posts:** Admin manages all | Shareholders view PUBLISHED only

**packages:** Super admin manages | Anyone views active

**notifications:** Users view/update own

**audit_logs:** Project admin views project logs | Super admin views all

### RLS Authoring Rules
```sql
-- ✅ CORRECT for INSERT
CREATE POLICY "name" ON table FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM project_admins WHERE ...));

-- ✅ CORRECT for SELECT/UPDATE/DELETE  
CREATE POLICY "name" ON table FOR SELECT
USING (EXISTS (SELECT 1 FROM project_admins WHERE ...));

-- ❌ WRONG — FOR ALL USING breaks INSERT
CREATE POLICY "name" ON table FOR ALL USING (...);

-- ❌ WRONG — nested finance_staff reference (table does not exist)
```

---

## 8. BUSINESS LOGIC & WORKFLOWS

### A. Shareholder Creation Flow
1. Project Admin submits: name, email, phone, password, unit_flat, ownership_pct, opening_balance, profile fields
2. API checks if email already exists in `auth.users`
   - **If exists:** links existing user to project as shareholder (does NOT change their role)
   - **If new:** creates auth user with `email_confirm: true`, creates profile with role=SHAREHOLDER, then creates shareholder record
3. Returns `tempPassword` if new user created
4. Default password if none provided: `"test1234"`

### B. Expense Lifecycle
```
DRAFT → (admin submits) → SUBMITTED → (committee reviews) → APPROVED or REJECTED or CHANGES_REQUESTED
                                                                    ↓
                                                            APPROVED → (admin publishes) → PUBLISHED
```
- Only **Project Admin** can create (DRAFT), submit, publish
- Only **Committee Members** can approve/reject/request changes
- **Approval Rule** (per project): `MAJORITY` (>50% of committee must approve) or `ANY_SINGLE` (one approval enough)
- **Shareholders** can only see PUBLISHED expenses
- **Publishing**: Admin can publish APPROVED expenses either from the detail page or directly from the table using the "Publish" button (instant update, no page navigation needed)

### C. Payment Schedule Generation
- Route: `POST /api/projects/[projectId]/generate-schedule`
- ⚠️ **Currently a STUB** — logs audit event but does not actually generate schedule_items
- Real implementation: reads `payment_schedules` config + `shareholders` ownership_pct → generates `schedule_items`

### D. Project Deletion — Mandatory Cascade Order
Delete in this exact sequence to avoid FK constraint errors.
⚠️ Tables marked with `→` do NOT have project_id — see FK Reference (§6B) for how to delete them.

1. `audit_logs` — direct project_id (delete FIRST — has FK constraint)
2. `notifications` — direct project_id
3. `reactions` → via `post_id` (fetch post IDs first)
4. `post_views` → via `post_id`
5. `activity_posts` — direct project_id
6. `expense_attachments` → via `expense_id` (fetch expense IDs first)
7. `expense_approvals` → via `expense_id`
8. `expenses` — direct project_id
9. `payments` — direct project_id
10. `penalties` → via `schedule_item_id` (fetch schedule IDs → item IDs first)
11. `schedule_items` → via `schedule_id` (fetch schedule IDs first)
12. `payment_schedules` — direct project_id
13. `milestones` — direct project_id
14. `penalty_configs` — direct project_id
15. `committee_members` — direct project_id
16. `shareholders` — direct project_id
17. `project_admins` — direct project_id
18. `expense_categories` — direct project_id
19. `notification_configs`, `approval_configs` — direct project_id
20. `project_documents` — direct project_id
21. `projects` — delete LAST

### E. Project Deletion Guards
- ❌ Cannot delete if project has shareholders with `status = 'ACTIVE'`
- ❌ Cannot delete if project has payments with `status != 'PAID'`

### F. Committee Expense Approval Logic
- Each committee member submits one vote: APPROVED, REJECTED, or CHANGES_REQUESTED
- REJECTED or CHANGES_REQUESTED → immediately updates expense status
- APPROVED with `ANY_SINGLE` rule → immediately marks APPROVED
- APPROVED with `MAJORITY` rule → counts approvals, marks APPROVED only when > 50% of active committee members have approved

---

## 9. CODE PATTERNS

### Standard API Route
```typescript
export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await props.params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Authorization
    try { await requireProjectAdmin(supabase, projectId) }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    // Business logic
    const body = await request.json()
    const { data, error } = await supabaseAdmin.from("table").insert(body).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Audit
    await logAction({ userId: user.id, projectId, action: "...", entityType: "...", entityId: data.id, details: {} })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

### Client State Update (No router.refresh!)
```typescript
// After successful API call:
const responseData = await res.json()
// ✅ Use functional state update — never call router.refresh() after setMilestones
setItems(prev => [...prev, responseData.data])
```

### Audit Logging
```typescript
await logAction({
  userId: user.id,
  projectId,           // optional
  action: "CREATE_X",
  entityType: "x",
  entityId: data.id,
  details: { ... }
}).catch(err => console.error("Audit failed:", err))
```

### Notification
```typescript
await createNotification({
  userId: targetUserId,
  projectId,
  type: "EXPENSE_APPROVED",
  title: "Expense approved",
  body: "Optional description",
  linkUrl: `/${projectId}/expenses/${id}`,
})
```

---

## 10. UNIMPLEMENTED FEATURES

| Feature | Status | Notes |
|---------|--------|-------|
| Finance Staff | ❌ Not built | Enum exists. DO NOT add finance_staff table yet. When building: use separate RLS policies per operation, do NOT add to is_project_member() |
| Payment Schedule Generation | ⚠️ Stub | Route exists but only logs audit. Real logic needs implementation |

---

## 11. PAGES USING supabaseAdmin (Documented Bypasses)

| File | Reason |
|------|--------|
| `(project-admin)/[projectId]/layout.tsx` | RLS blocks project read for project admins |
| `(project-admin)/[projectId]/activity-log/page.tsx` | Uses supabaseAdmin to join profiles on audit_logs for actor names |
| `(project-admin)/[projectId]/committee/page.tsx` | Cross-table read: committee + shareholders |
| `(shareholder)/my/dashboard/page.tsx` | RLS blocks shareholder reading own record |
| `(shareholder)/my/feed/page.tsx` | Same as above |

---

## 12. FEATURE LOG

| Date | Feature | Files Changed | DB Changes |
|------|---------|--------------|------------|
| Apr 2026 | Fix Publish button dark theme accessibility on Expenses table | `(project-admin)/[projectId]/expenses/ExpensesClient.tsx` | None — UI only |
| Apr 2026 | Committee review count badge in navigation | `(shareholder)/layout.tsx`, `api/projects/[projectId]/committee/pending-count/route.ts` | None — queries existing tables |
| Apr 2026 | Quick publish expense from table | `expenses/ExpensesClient.tsx` | None — UI + API integration only |
| Apr 2026 | Fix cascade delete (reactions, post_views, expense_attachments, expense_approvals, schedule_items, penalties, notifications) | `api/projects/[projectId]/route.ts` | None — code fix only |
| Apr 2026 | Delete project (Super Admin) | `api/projects/[projectId]/route.ts`, `projects/page.tsx` | None |
| Apr 2026 | Delete project admin | `api/projects/[projectId]/admin/[adminId]/route.ts`, `projects/[projectId]/page.tsx` | None |
| Apr 2026 | Delete shareholder | `api/projects/[projectId]/shareholders/[shareholderId]/route.ts` | None |
| Apr 2026 | Fix shareholders RLS | — | Recreated SELECT/INSERT/UPDATE/DELETE policies with explicit EXISTS |
| Apr 2026 | Fix committee RLS | `committee/page.tsx` | Replaced function-based with explicit EXISTS policies |
| Apr 2026 | Fix project admin layout | `(project-admin)/[projectId]/layout.tsx` | None — switched to supabaseAdmin |
| Apr 2026 | Fix shareholder dashboard/feed | `my/dashboard/page.tsx`, `my/feed/page.tsx` | None — switched to supabaseAdmin |
| Apr 2026 | Fix milestone instant render | `milestones/MilestoneTimeline.tsx` | None — removed router.refresh() |
| Apr 2026 | Fix is_project_member() | — | Removed finance_staff reference from DB function |
| Apr 2026 | Remove Finance Staff SQL | — | Dropped finance_staff table + all RLS policies it added |
| Apr 2026 | Activity Log page + sidebar nav for Project Admin | `(project-admin)/[projectId]/activity-log/page.tsx`, `activity-log/ActivityLogClient.tsx`, `components/layouts/ProjectAdminShell.tsx`, `(project-admin)/[projectId]/dashboard/page.tsx` | None — queries existing audit_logs table |
| Apr 2026 | Milestone expense totals in cards | `(project-admin)/[projectId]/milestones/page.tsx`, `(project-admin)/[projectId]/milestones/MilestoneTimeline.tsx`, `(shareholder)/my/milestones/page.tsx`, `(shareholder)/my/milestones/MilestoneReadonly.tsx` | None — queries existing expenses table grouped by milestone_id |
| Apr 2026 | Project Update feature — rename Activity Feed, modal composer, committee member posting | `components/layouts/ProjectAdminShell.tsx`, `(shareholder)/layout.tsx`, `feed/FeedClient.tsx`, `feed/CreatePostForm.tsx`, `feed/AdminPostCard.tsx`, `(shareholder)/my/feed/page.tsx`, `(shareholder)/my/feed/ShareholderFeedClient.tsx`, `(shareholder)/my/feed/PostCard.tsx`, `api/.../posts/route.ts`, `api/.../posts/[id]/route.ts`, `api/.../posts/[id]/hide/route.ts` | None — logic change only |
| Apr 2026 | Mobile horizontal scroll for all data tables | `(shareholder)/my/defaulters/DefaultersClient.tsx`, `(shareholder)/my/expenses/ShareholderExpensesClient.tsx`, `(shareholder)/my/payments/ShareholderPaymentsClient.tsx`, `(project-admin)/[projectId]/defaulters/DefaultersClient.tsx`, `(project-admin)/[projectId]/expenses/ExpensesClient.tsx`, `(project-admin)/[projectId]/committee/CommitteeClient.tsx`, `(project-admin)/[projectId]/documents/DocumentsClient.tsx`, `(project-admin)/[projectId]/activity-log/ActivityLogClient.tsx`, `(project-admin)/[projectId]/payments/tabs/AllPaymentsTab.tsx`, `(project-admin)/[projectId]/payments/tabs/ScheduleTab.tsx`, `(project-admin)/[projectId]/payments/tabs/DefaultersTab.tsx` | None — UI only, replaced overflow-hidden with overflow-x-auto on table wrapper divs |
<<<<<<< HEAD
| Apr 2026 | Rename "Project Update" nav label to "Project Update Feed" | `components/layouts/ProjectAdminShell.tsx`, `(shareholder)/layout.tsx` | None — UI label only |
=======
| Apr 2026 | Remove redundant in-page titles from all pages (header bar already shows page title) | `(super-admin)/dashboard/page.tsx`, `(super-admin)/projects/page.tsx`, `(super-admin)/packages/page.tsx`, `(super-admin)/admins/page.tsx`, `(project-admin)/[projectId]/feed/FeedClient.tsx`, `(project-admin)/[projectId]/documents/DocumentsClient.tsx`, `(project-admin)/[projectId]/activity-log/page.tsx`, `(project-admin)/[projectId]/settings/ProjectSettingsClient.tsx`, `(project-admin)/[projectId]/milestones/MilestoneTimeline.tsx`, `(project-admin)/[projectId]/expenses/ExpensesClient.tsx`, `(project-admin)/[projectId]/shareholders/ShareholdersTable.tsx`, `(project-admin)/[projectId]/reports/ReportsClient.tsx`, `(project-admin)/[projectId]/payments/PaymentsClient.tsx`, `(project-admin)/[projectId]/defaulters/DefaultersClient.tsx`, `(project-admin)/[projectId]/expenses/[id]/ExpenseDetailClient.tsx`, `(shareholder)/my/feed/page.tsx`, `(shareholder)/my/payments/ShareholderPaymentsClient.tsx`, `(shareholder)/my/review/page.tsx`, `(shareholder)/my/shareholders/page.tsx`, `(shareholder)/my/shareholders/ShareholdersList.tsx`, `(shareholder)/my/milestones/MilestoneReadonly.tsx`, `(shareholder)/my/defaulters/page.tsx`, `(shareholder)/my/profile/page.tsx`, `(shareholder)/my/expenses/page.tsx`, `(shareholder)/my/documents/ShareholderDocsClient.tsx` | None — UI only |
>>>>>>> remove-page-header

---

## 13. LIVE DATA (April 2026)

| Table | Count |
|-------|-------|
| Projects | 2 (Homelink Atifa Palace, Green Valley Heights) |
| Shareholders | 25 |
| Project Admins | 2 |
| Committee Members | 6 |
| Milestones | 10+ |
| Expenses | 9 |
| Payments | 7 |

---

## 14. TERMINAL COMMANDS

```bash
npm run dev      # Dev server → http://localhost:3000
npm run build    # Production build
npm run start    # Run production build
npm install      # Install dependencies
```

---

## HOW TO UPDATE THIS FILE

After every completed task, update:
1. **Feature Log** — new row: date, feature, files changed, DB changes
2. **App Structure** — add new files/routes
3. **Database Schema** — add new tables/enums
4. **RLS Policies** — add new policies
5. **Business Logic** — document new workflows
6. **Unimplemented Features** — update status

**Never delete historical entries. Always append.**
