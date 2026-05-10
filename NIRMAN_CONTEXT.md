# NIRMAN — AI Agent Source of Truth
> Version: 1.4 | Last Updated: May 2026
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
| Framework | Next.js 16.2.3 App Router (Server Components by default) — ⚠️ middleware renamed to `proxy.ts` in v16 |
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

### Proxy / Middleware (`src/proxy.ts` + `src/lib/supabase/middleware.ts`)
- ⚠️ Next.js 16 renamed `middleware.ts` → `proxy.ts`. The entry point is `src/proxy.ts`, which calls `updateSession` from `src/lib/supabase/middleware.ts`.
- Runs on every request (matcher excludes static assets)
- Applies rate limiting before any API route: 60 req/min general, 20 req/min on upload paths
- Refreshes Supabase session cookies
- Redirects unauthenticated users to `/login`
- Does NOT handle role-based routing (roles handled in each layout)

### Role-Based Routing (in each layout)
- `(super-admin)/layout.tsx` → checks `profile.role === 'SUPER_ADMIN'`
- `(project-admin)/[projectId]/layout.tsx` → checks `project_admins` table for user+project
- `(shareholder)/layout.tsx` → checks `profile.role === 'SHAREHOLDER'`

---

## 4. DESIGN SYSTEM (Truzo Brand Palette — May 2026)

The app uses a custom MD3-based design system via CSS variables defined in `src/app/globals.css` under `@theme inline {}`. Always use these tokens, never hardcode colors.

### Core Color Tokens (Light Mode)

| Token | Value | Use For |
|-------|-------|---------|
| `bg-primary` / `text-primary` | #1B4FFF (blue) | CTA buttons, links, active nav — **reserved for actions only, not icon backgrounds** |
| `bg-primary-container` | #E8EDFF | Subtle primary tint |
| `text-on-primary-container` | #0A3ACC | Text on primary container |
| `bg-secondary` / `text-secondary` | #00C2A8 (teal) | Secondary actions |
| `bg-secondary-container` | #E0F9F6 | Teal-tinted backgrounds (SUBMITTED, DUE status) |
| `text-on-secondary-container` | #007A6B | Text on secondary container |
| `bg-tertiary` | #FF6B2B (orange) | CTA submit buttons, accent actions |
| `bg-tertiary-container` | #FFE8DB | Orange-tinted backgrounds (Expenses, Shareholders icons) |
| `text-on-tertiary-container` | #B94310 | Text on tertiary container |
| `bg-background` | #F5F7FF | Page background |
| `bg-surface` | #FFFFFF | ⚠️ Pure white — avoid for large section wrappers, only use for small inline elements (selects, tag pills) |
| `bg-card` | #FFFFFF | ⚠️ Same as surface — avoid for large card wrappers; remove `bg-card` from full-width section containers |
| `text-on-surface` | #1A1A2E | Main body text |
| `bg-surface-variant` | #EEF2FF | Subtle container tint |
| `text-on-surface-variant` | #5C6494 | Secondary/muted text — use this, NOT `text-outline` |
| `bg-surface-container-low` | #EEF2FF | Slightly raised surfaces |
| `bg-surface-container` | #E8EDFF | Container |
| `bg-surface-container-high` | #DDE5FF | Higher container |
| `--m3-outline` / `border-outline-variant` | #E5E8F0 | Borders only — **never use `text-outline` as text color** |
| `bg-success-container` | #DCFCE7 | APPROVED, COMPLETED, Paid status |
| `text-on-success-container` | #166534 | Text on success container |
| `bg-warning-container` | #FEF3C7 | CHANGES_REQUESTED, PENDING, upcoming dues |
| `text-on-warning-container` | #92400E | Text on warning container |
| `bg-error-container` | #FEE2E2 | REJECTED, OVERDUE, penalties, errors |
| `text-on-error-container` | #991B1B | Text on error container |

### Status Badge Semantic Mapping

| Status | Classes |
|--------|---------|
| SUBMITTED / DUE | `bg-secondary-container text-on-secondary-container` |
| CHANGES_REQUESTED / PENDING | `bg-warning-container text-on-warning-container` |
| APPROVED / COMPLETED / PAID | `bg-success-container text-on-success-container` |
| PUBLISHED / ACTIVE | `bg-primary-container text-on-primary-container` |
| REJECTED / OVERDUE / ERROR | `bg-error-container text-on-error-container` |
| DRAFT / UPCOMING | `bg-surface-variant/50 text-on-surface-variant` |
| PARTIALLY_PAID | `bg-warning-container text-on-warning-container` |

### Dashboard Icon Background Convention (no blue)

| Context | `iconBg` | `iconColor` |
|---------|----------|-------------|
| Expenses / Shareholders | `bg-tertiary-container` | `text-on-tertiary-container` |
| Payments / Schedule | `bg-secondary-container` | `text-on-secondary-container` |
| Reports / Financial | `bg-success-container` | `text-on-success-container` |
| Errors / Penalties | `bg-error-container` | `text-on-error-container` |
| Warnings / Dues | `bg-warning-container` | `text-on-warning-container` |

Blue (`bg-primary-container`) is **reserved for CTA buttons and links**, not icon backgrounds.

### Logo Standard

The Truzo logo is always plain text — no SVG, no image. The canonical style across every surface:

```tsx
<span className="text-[22px] font-bold text-[#1B4FFF] tracking-tight">Truzo</span>
```

Exception — landing page `Nav.tsx` only: white on hero (transparent nav), blue on scroll (white nav background):
```tsx
className={`text-[22px] font-bold tracking-tight transition-colors duration-300 ${scrolled ? "text-[#1B4FFF]" : "text-white"}`}
```

Login page uses `text-[36px]` (larger display size) but same `font-bold text-[#1B4FFF] tracking-tight`.

### ⚠️ White Background Anti-Patterns

Pages use `bg-background` (#F5F7FF). Any container using `bg-surface` (#FFFFFF) or `bg-card` (#FFFFFF) creates a visible white box. Rules:

- Large section wrappers (timeline containers, page-level cards): **no background class** — just use `border border-outline-variant/40 rounded-xl`
- Feed cards and compose boxes: **no background** — just `border border-outline-variant/60 rounded-xl`
- Settings, Milestone, Feed pages have all been fixed. If a page looks "extra white", remove `bg-surface` or `bg-card` from its outermost wrapper.
- Small inline elements (select dropdowns, tag pills) may still use `bg-surface` — that's fine.

### Typography Scale
```
h1: text-[28px] font-normal tracking-tight
h2: text-[22px] font-medium tracking-tight
h3: text-[16px] font-semibold
p:  text-[14px] font-normal leading-relaxed text-on-surface-variant
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
// Card / section container (no white background)
<div className="rounded-xl border border-outline-variant/40">

// Primary CTA button
<Button className="bg-primary hover:bg-primary/90 text-white">

// Submit / accent CTA button (orange)
<Button className="bg-tertiary hover:bg-tertiary/90 text-on-tertiary">

// Status badge
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-success-container text-on-success-container">

// Section header
<h1 className="text-2xl font-bold text-on-surface">
<p className="text-sm text-on-surface-variant mt-0.5">

// Secondary muted text — always use this, never text-outline
<p className="text-xs text-on-surface-variant">
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
│   │   │   └── tabs/AllPayments, Schedule, RecordPayment, WaitingForApprovalTab  # RecordPayment + AddCustomCollection as modals; WaitingForApprovalTab lists submitted proofs with approve/reject actions
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
│   │   ├── payments/page.tsx + ShareholderPaymentsClient.tsx + SubmitPaymentProofModal.tsx + statement/page.tsx
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
│       │   ├── payment-proofs/route.ts                # GET (admin fetches all) | POST (shareholder submits with file)
│       │   ├── payment-proofs/[id]/approve/route.ts   # POST → creates payment + marks APPROVED
│       │   ├── payment-proofs/[id]/reject/route.ts    # POST → marks REJECTED
│       │   ├── payment-schedule/route.ts
│       │   ├── notification-config/route.ts
│       │   ├── settings/route.ts
│       │   ├── dashboard/route.ts
│       │   ├── details/route.ts
│       │   └── reports/audit-log | defaulters | expense-ledger | collection-summary
│       ├── super-admin/admins/route.ts          # GET | POST create admin
│       ├── super-admin/admins/[adminId]/route.ts # DELETE
│       ├── packages/route.ts | [id]/route.ts | [id]/status/route.ts
│       ├── profile/route.ts | avatar/route.ts | password/route.ts
│       ├── profiles/[userId]/route.ts
│       ├── notifications/route.ts | [id]/read | read-all
│       └── dashboard/platform/route.ts
│
├── lib/
│   ├── permissions.ts      # requireRole, requireProjectAdmin, requireProjectMember, requireCommitteeMember, getProjectRole
│   ├── audit.ts            # logAction()
│   ├── notifications.ts    # createNotification()
│   ├── penalty.ts          # Penalty calculation logic
│   ├── cache.ts            # In-memory TTL cache (5 min) — cacheGet, cacheSet, cacheInvalidate, cacheInvalidatePrefix
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
    ├── icons/
    │   └── ClapIcon.tsx    # (unused — kept for reference; app uses Lucide Meh/Frown/PartyPopper instead)
    ├── profile/
    │   ├── ProfileForm.tsx          # Read-only profile view with "Edit Profile" button (all roles)
    │   ├── EditProfileModal.tsx     # Modal dialog form for editing profile info (all roles)
    │   ├── ManagePassword.tsx       # Password change section (all roles)
    │   └── ShareholderPaymentModelCard.tsx  # Read-only payment model display on shareholder profile
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
| `penalties` | Late payment penalties per schedule_item. Columns: id, schedule_item_id, amount (zeroed on waiver), calculated_at, is_waived, waived_amount, waive_reason, waived_at |
| `penalty_configs` | Penalty rules per project. Columns: id, project_id (unique), grace_days, penalty_type (NONE/FIXED_AMOUNT/PERCENT_OF_DUE/DAILY_PERCENT), fixed_amount, percent_rate, daily_rate, cap |
| `expenses` | Project expenses (full lifecycle) |
| `expense_categories` | Expense categories per project |
| `expense_attachments` | Files attached to expenses |
| `expense_approvals` | Committee approval records per expense |
| `activity_posts` | Feed posts with optional media |
| `reactions` | Post reactions (LIKE/LOVE/MEH/SAD) |
| `post_views` | View tracking — one row per user per login session (session_id from JWT) |
| `project_documents` | Project documents |
| `approval_configs` | Expense approval rule (MAJORITY/ANY_SINGLE) |
| `notification_configs` | Notification settings per project |
| `notifications` | In-app notifications |
| `audit_logs` | Full audit trail of all actions |
| `payment_proofs` | Shareholder-submitted payment proof — links to project, shareholder, optional schedule_item, optional payment (set on approval). Columns: id, project_id, shareholder_id, schedule_item_id, amount, attachment_url, attachment_name, notes, rejection_note, status (PENDING/APPROVED/REJECTED), submitted_at, reviewed_at, reviewed_by, payment_id |
| `shareholder_payment_models` | One row per shareholder (unique on shareholder_id). Columns: id, shareholder_id, project_id, monthly_enabled, monthly_amount, monthly_due_day (1–28), milestone_based_enabled, milestone_amount, created_at, updated_at. Either or both modes can be active for a single shareholder. |

### 6B. FK Reference — Child Tables Without project_id

> ⚠️ These tables do NOT have a `project_id` column. Any delete, join, or filter query MUST go through the parent. This is the #1 source of silent bugs.

| Table | FK Column | Links To | How to Delete for a Project |
|-------|-----------|----------|-----------------------------|
| `reactions` | `post_id` | `activity_posts.id` | Get post IDs first → delete where `post_id IN [postIds]` |
| `post_views` | `post_id` | `activity_posts.id` | Same as reactions |
| `expense_attachments` | `expense_id` | `expenses.id` | Get expense IDs first → delete where `expense_id IN [expenseIds]` |
| `expense_approvals` | `expense_id` | `expenses.id` | Same as attachments |
| `schedule_items` | `schedule_id` | `payment_schedules.id` | Get schedule IDs first → delete where `schedule_id IN [scheduleIds]` |
| `shareholder_payment_models` | `shareholder_id` | `shareholders.id` | Cascades automatically (ON DELETE CASCADE) |
| `penalties` | `schedule_item_id` | `schedule_items.id` | Get schedule IDs → get item IDs → delete where `schedule_item_id IN [itemIds]` |

> ⚠️ `payment_proofs` has a direct `project_id` BUT also has FKs to both `schedule_items` and `payments`. Before deleting a schedule_item, must set `payment_proofs.schedule_item_id = NULL`. Before deleting a payment, must set `payment_proofs.payment_id = NULL`. See delete handlers in `schedules/[id]/route.ts` and `payments/[id]/route.ts`.

All other project-related tables have a direct `project_id` column.

### Key Enums
```sql
global_role:         SUPER_ADMIN, PROJECT_ADMIN, FINANCE_STAFF, SHAREHOLDER
project_status:      PILOT, ACTIVE, ARCHIVED
shareholder_status:  ACTIVE, INACTIVE
milestone_status:    UPCOMING, IN_PROGRESS, COMPLETED
expense_status:      DRAFT, SUBMITTED, CHANGES_REQUESTED, REJECTED, APPROVED, PUBLISHED
payment_method:      CASH, BANK_TRANSFER, BKASH, NAGAD, CHEQUE
penalty_type:        NONE, FIXED_AMOUNT, PERCENT_OF_DUE, DAILY_PERCENT
due_status:          UPCOMING, DUE, OVERDUE, PAID, PARTIALLY_PAID
schedule_type:       MONTHLY, MILESTONE, MIXED
approval_rule:       MAJORITY, ANY_SINGLE
notification_type:   PAYMENT_REMINDER, PAYMENT_OVERDUE, EXPENSE_SUBMITTED, EXPENSE_APPROVED, EXPENSE_REJECTED, EXPENSE_PUBLISHED, ACTIVITY_POST, PENALTY_APPLIED
media_type:          IMAGE, VIDEO, AUDIO
reaction_type:       LIKE, LOVE, APPRECIATE (deprecated), MEH, SAD
post_status:         PUBLISHED, HIDDEN
payment_proof_status: PENDING, APPROVED, REJECTED
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

**payment_proofs:** Shareholders INSERT own (WITH CHECK via shareholders.user_id) | Shareholders SELECT own | Project admins SELECT all for project | Project admins UPDATE (approve/reject)

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

### G. Payment Proof Submission & Approval Flow
```
Shareholder → "Submit Payment Proof" modal → selects schedule item (optional) → enters amount (partial OK) → uploads attachment (mandatory) → submits
                                                                                                                                                    ↓
                                                              POST /api/projects/[projectId]/payment-proofs (multipart/form-data)
                                                                    • Uploads file to expense-proofs storage bucket at path: payment-proofs/[projectId]/[proofId]/[file]
                                                                    • Inserts payment_proofs row with status=PENDING
                                                                    ↓
                                             Project Admin → "Waiting for Approval" tab → sees proof card with attachment link → clicks "Record Payment"
                                                                    ↓
                                             POST /api/projects/[projectId]/payment-proofs/[id]/approve
                                                                    • Creates payments row (standard record)
                                                                    • Updates payment_proofs.status = APPROVED, links payment_id
                                                              OR → "Reject" → POST /api/projects/[projectId]/payment-proofs/[id]/reject
                                                                    • Updates payment_proofs.status = REJECTED
```
- Shareholder can see all their submitted proofs in "Submitted Proofs" tab with status badges
- Admin sees pending count badge on "Waiting for Approval" tab (yellow when there are pending items)
- After approval, the new payment appears in Payment History for both admin and shareholder

### K. Payment Model + Schedule Generation Flow
- **Payment Model:** Configured per shareholder in the Add/Edit Shareholder dialog. Two modes (both selectable simultaneously):
  - **Monthly Fixed Amount** — requires `monthly_amount` (৳) and `monthly_due_day` (1–28). Generates items whose due_date falls within today → today+30 calendar days (checks up to 3 months ahead to cover windows spanning two months). Deduped by shareholder_id + due_date.
  - **Milestone Based** — requires `milestone_amount > 0` (skipped if null or 0 — never generates ৳0 items). Generates one `schedule_item` per UPCOMING/IN_PROGRESS milestone not already scheduled for that shareholder.
- **Storage:** `shareholder_payment_models` table, one row per shareholder (unique constraint). Upserted on create/edit; deleted if both modes disabled on edit.
- **Generate Schedule Items button** (Payments page → header): `POST /api/projects/[projectId]/generate-schedule`. Reads all ACTIVE shareholders with a payment model, deduplicates against existing `schedule_items`, inserts new items in a single batch. Returns count of newly generated items.
- **After generation:** PaymentsClient re-fetches `page-data/payments` to refresh the Collection Schedule tab with new items.
- **Milestone mapping:** Admin can edit any generated schedule item to attach/change its `milestone_id` via the existing Edit Installment dialog on the Collection Schedule tab.
- **Add Custom Collection:** Multi-select shareholder picker — admin can select one or more shareholders; one schedule item is created per shareholder in parallel with optimistic rows. Popover stays open during selection. Column header is "Payment Type / Milestone"; items without a milestone show "General (Monthly Payment)".
- **Payment Model form rule:** At least one mode must be selected when adding a new shareholder (enforced client-side). Editing an existing shareholder has no minimum requirement.
- **Shareholder visibility:** Shareholders see their payment model on their own Profile page (`/my/profile`) as a read-only card (`ShareholderPaymentModelCard`). They cannot see other shareholders' models.

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
9. `payment_proofs` — direct project_id
10. `payments` — direct project_id
11. `penalties` → via `schedule_item_id` (fetch schedule IDs → item IDs first)
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

### H. Penalty Engine
- **Configuration:** Project Admin configures penalty rules in Settings → Penalties tab. One `penalty_configs` row per project (upserted).
- **Penalty types:** `NONE` (no penalties), `FIXED_AMOUNT` (flat ৳ amount), `PERCENT_OF_DUE` (% of outstanding due), `DAILY_PERCENT` (% per day of delay, compounding). Optional `cap` limits maximum penalty per installment. Configurable `grace_days` — no penalty until grace period expires.
- **Calculation engine:** `src/lib/penalty.ts` — `calculatePenalty()` evaluates a single schedule item against config; `applyPendingPenalties()` sweeps all DUE/OVERDUE/PARTIALLY_PAID items and upserts penalty rows.
- **Trigger:** Manual — admin clicks "Trigger Penalty Sweep" on Defaulters page. Calls `POST /api/projects/[projectId]/penalties/apply`.
- **Individual waiver:** Admin clicks "Waive" button on Defaulters page → dialog shows each active penalty → admin enters reason → calls `POST /api/projects/[projectId]/penalties/[id]/waive`. Sets `is_waived=true`, `amount=0`, records `waived_amount`, `waive_reason`, `waived_at`. Waived penalties are skipped on future sweeps.
- **Payment-time waiver:** Admin can check "Waive late fees" when recording a payment. The payment API (`POST /api/projects/[projectId]/payments`) waives all active penalties for that shareholder with full audit trail (waived_amount, reason, timestamp).
- **Display:** Penalties shown in Defaulters page (admin), Schedule tab, Payment History, Shareholder My Payments, and Shareholder Defaulters views.

### I. Password Change Flow
- Any authenticated user (SUPER_ADMIN, PROJECT_ADMIN, SHAREHOLDER) can change their own password from the Profile page.
- **UI:** "Manage Password" section at the bottom of the Profile page with three fields: Current Password, New Password, Confirm New Password.
- **API:** `POST /api/profile/password` — validates current password via `signInWithPassword`, then calls `supabase.auth.updateUser({ password })` to set the new one.
- **Validation:** Current password required, new password min 8 chars, confirm must match.
- **Audit:** Logs `CHANGE_PASSWORD` action on success.

### J. Profile Edit Flow
- All roles (SUPER_ADMIN, PROJECT_ADMIN, SHAREHOLDER) see profile as a read-only card on the Profile page.
- **UI:** "Edit Profile" button in the profile header opens a modal dialog (`EditProfileModal`) with a form to update: name, phone, whatsapp_no, profession, designation, organization, present_address. Avatar can also be changed from within the modal.
- **API:** Uses existing `PUT /api/profile` to update profile fields; `POST /api/profile/avatar` for avatar upload.
- **State:** After successful save, the read-only view updates instantly via local state (no `router.refresh()`).
- **Audit:** Logs `UPDATE_PROFILE` action on success.

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
| Payment Schedule Generation | ✅ Implemented | Real engine generates monthly + milestone-based schedule items per active shareholder payment models |

---

## 11. PAGES USING supabaseAdmin (Documented Bypasses)

| File | Reason |
|------|--------|
| `(project-admin)/[projectId]/layout.tsx` | RLS blocks project read for project admins |
| `(project-admin)/[projectId]/activity-log/page.tsx` | Uses supabaseAdmin to join profiles on audit_logs for actor names |
| `(project-admin)/[projectId]/committee/page.tsx` | Cross-table read: committee + shareholders |
| `(shareholder)/my/dashboard/page.tsx` | RLS blocks shareholder reading own record |
| `(shareholder)/my/feed/page.tsx` | Same as above |
| `(shareholder)/my/payments/page.tsx` | Fetches own payment_proofs — supabaseAdmin used to bypass RLS on server page |
| `(project-admin)/[projectId]/payments/page.tsx` | Fetches all payment_proofs for project — supabaseAdmin used |
| `(shareholder)/my/profile/page.tsx` | Fetches own shareholder record + payment model — supabaseAdmin used |

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
| Apr 2026 | Rename "Project Update" nav label to "Project Update Feed" | `components/layouts/ProjectAdminShell.tsx`, `(shareholder)/layout.tsx` | None — UI label only |
| Apr 2026 | Remove redundant in-page titles from all pages (header bar already shows page title) | Multiple page/client files across super-admin, project-admin, and shareholder routes | None — UI only |
| Apr 2026 | Fix reaction column name bug (reaction_type → type) across all reaction queries | `feed/page.tsx`, `(shareholder)/my/feed/page.tsx`, `api/.../react/route.ts`, `api/.../posts/route.ts` | None — code fix only |
| Apr 2026 | Committee member avatar initials fix in CreatePostForm | `(shareholder)/my/feed/ShareholderFeedClient.tsx` | None — pass userName prop |
| Apr 2026 | View count feature — per login session, live increment | `api/.../posts/[id]/view/route.ts`, `feed/AdminPostCard.tsx`, `(shareholder)/my/feed/PostCard.tsx`, `feed/page.tsx`, `(shareholder)/my/feed/page.tsx` | Dropped unique constraint on post_views(post_id,user_id); added session_id column + partial unique index on (post_id,user_id,session_id) |
| Apr 2026 | Remove Defaulters tab from Project Admin payments page (dedicated menu exists) | `payments/PaymentsClient.tsx` | None — UI only |
| Apr 2026 | Payments page redesign — 2 tabs only (Collection Schedule + Payment History); Record Payment → primary CTA modal; Add Custom Collection → secondary CTA modal; both buttons in page header | `payments/PaymentsClient.tsx`, `payments/tabs/RecordPaymentTab.tsx`, `payments/tabs/ScheduleTab.tsx` | None — UI only |
| Apr 2026 | Record Payment modal — balance summary inline card (Principal/Penalties/Total in 3-col row, Paying Now full-width row); shareholder selector replaced with searchable Popover+Command combobox; all dropdowns (schedule link, payment method) converted to same combobox style | `payments/tabs/RecordPaymentTab.tsx` | None — UI only |
| Apr 2026 | Add Custom Collection modal — shareholder dropdown converted to searchable combobox; Target Milestone and Status dropdowns converted to same combobox style; modal open state lifted to PaymentsClient | `payments/tabs/ScheduleTab.tsx`, `payments/PaymentsClient.tsx` | None — UI only |
| Apr 2026 | Collection Schedule filter — replaced native select with Popover+Command combobox matching form dropdowns; removed wrapper background/border | `payments/tabs/ScheduleTab.tsx` | None — UI only |
| Apr 2026 | Replace Appreciate reaction with Meh + Sad; swap icon to PartyPopper then Meh/Frown | `feed/AdminPostCard.tsx`, `(shareholder)/my/feed/PostCard.tsx`, `ShareholderFeedClient.tsx`, `feed/page.tsx`, `(shareholder)/my/feed/page.tsx`, `api/.../react/route.ts`, `components/icons/ClapIcon.tsx` (created then removed) | Added MEH, SAD to reaction_type enum; APPRECIATE deprecated but retained in DB |
| Apr 2026 | Payment proof table view + search + rejection note — all proof tabs converted from cards to tables; search box added to all admin payment tab groups (Schedule, History, Waiting for Approval); reject modal now requires a written reason visible to shareholder; DB: added rejection_note column to payment_proofs | `payments/tabs/WaitingForApprovalTab.tsx`, `payments/tabs/AllPaymentsTab.tsx`, `payments/tabs/ScheduleTab.tsx`, `(shareholder)/my/payments/ShareholderPaymentsClient.tsx`, `api/.../payment-proofs/[id]/reject/route.ts` | Added `rejection_note TEXT` column to `payment_proofs` |
| Apr 2026 | Waiting for Approval — single unified table (removed Pending/Reviewed split sections and titles); APPROVED proofs filtered out (already in Payment History); action buttons converted to ghost icon style (h-8 w-8) matching shareholders page | `payments/tabs/WaitingForApprovalTab.tsx` | None — UI only |
| Apr 2026 | Fix approve route — removed non-existent project_id column from payments insert; added receipt_no generation (NRM-[PROJ]-YYYYMMDD-SEQ format) matching standard payment route | `api/projects/[projectId]/payment-proofs/[id]/approve/route.ts` | None — code fix |
| Apr 2026 | Shareholder Submitted Proofs — hide APPROVED items (redundant with Payment History); tab badge count reflects only PENDING+REJECTED | `(shareholder)/my/payments/ShareholderPaymentsClient.tsx` | None — UI only |
| Apr 2026 | Proof attachment — shown as Paperclip icon button (with filename tooltip) instead of text link in Payment History for both admin and shareholder; fetched via nested select proof:payment_proofs(attachment_url, attachment_name) on payments query | `payments/tabs/AllPaymentsTab.tsx`, `(shareholder)/my/payments/ShareholderPaymentsClient.tsx`, `(project-admin)/[projectId]/payments/page.tsx`, `(shareholder)/my/payments/page.tsx` | None — query change only |
| Apr 2026 | Remove Notes column from Waiting for Approval table (admin) and Submitted Proofs table (shareholder) | `payments/tabs/WaitingForApprovalTab.tsx`, `(shareholder)/my/payments/ShareholderPaymentsClient.tsx` | None — UI only |
| Apr 2026 | Submit Payment Proof — shareholder submits proof, admin reviews in new "Waiting for Approval" tab; approve creates payment record | `(shareholder)/my/payments/ShareholderPaymentsClient.tsx`, `(shareholder)/my/payments/SubmitPaymentProofModal.tsx` (NEW), `(shareholder)/my/payments/page.tsx`, `(project-admin)/[projectId]/payments/PaymentsClient.tsx`, `(project-admin)/[projectId]/payments/tabs/WaitingForApprovalTab.tsx` (NEW), `(project-admin)/[projectId]/payments/page.tsx`, `api/projects/[projectId]/payment-proofs/route.ts` (NEW), `api/projects/[projectId]/payment-proofs/[id]/approve/route.ts` (NEW), `api/projects/[projectId]/payment-proofs/[id]/reject/route.ts` (NEW) | New table: `payment_proofs`; New enum: `payment_proof_status (PENDING, APPROVED, REJECTED)`; 4 RLS policies; Storage: uses existing `expense-proofs` bucket at path `payment-proofs/[projectId]/[proofId]/[file]` |
| Apr 2026 | Fix Penalty Engine — 4 bugs fixed: (1) type string mismatch `FIXED` → `FIXED_AMOUNT` in calculation engine, (2) payment-time waiver now records full waive data (waived_amount, amount:0, waive_reason, waived_at), (3) individual penalty waive UI with reason dialog added to Defaulters page, (4) Settings dropdown now exposes all 4 penalty types (NONE, FIXED_AMOUNT, PERCENT_OF_DUE, DAILY_PERCENT) with conditional fields and cap | `src/lib/penalty.ts`, `src/app/api/projects/[projectId]/payments/route.ts`, `src/app/(project-admin)/[projectId]/defaulters/DefaultersClient.tsx`, `src/app/(project-admin)/[projectId]/settings/ProjectSettingsClient.tsx` | None — code fix + UI only |
| May 2026 | Manage Password — profile page password change for all roles (Super Admin, Project Admin, Shareholder) | `src/app/api/profile/password/route.ts` (NEW), `src/components/profile/ManagePassword.tsx` (NEW), `(super-admin)/profile/page.tsx`, `(project-admin)/[projectId]/profile/page.tsx`, `(shareholder)/my/profile/page.tsx` | None — uses Supabase Auth `updateUser` |
| May 2026 | Profile read-only view + Edit Profile modal — all roles see profile as read-only card with "Edit Profile" button that opens a modal dialog form to update profile info (name, phone, whatsapp, profession, designation, organization, address) | `src/components/profile/ProfileForm.tsx` (rewritten), `src/components/profile/EditProfileModal.tsx` (NEW) | None — reuses existing PUT /api/profile endpoint |
| May 2026 | Sticky search + add shareholder button on Shareholders page (Project Admin) — search bar, stats badges, and "Add Shareholder" button remain fixed at top with sticky positioning while scrolling | `(project-admin)/[projectId]/shareholders/ShareholdersTable.tsx` | None — UI only |
| May 2026 | Fix payment delete/edit not updating instantly in Payment History — replaced router.refresh() with local state updates via callbacks from PaymentsClient; fixed data.data → data.payment reference error | `(project-admin)/[projectId]/payments/tabs/AllPaymentsTab.tsx`, `(project-admin)/[projectId]/payments/PaymentsClient.tsx` | None — code fix only |
| May 2026 | Fix schedule item deletion blocked by payment_proofs FK — nullify schedule_item_id on linked payment_proofs and delete linked penalties before deleting schedule_item | `api/projects/[projectId]/schedules/[id]/route.ts` | None — code fix only |
| May 2026 | Fix schedule item CRUD instant update — replaced all router.refresh() calls with local state updates (setLocalScheduleItems / setLocalPayments) in ScheduleTab | `(project-admin)/[projectId]/payments/tabs/ScheduleTab.tsx` | None — code fix only |
| May 2026 | Fix custom collection missing shareholder info after create — API now returns schedule_item with nested joins (shareholder+profiles, milestone, penalties) matching the page fetch query | `api/projects/[projectId]/schedules/route.ts` | None — code fix only |
| May 2026 | Optimize schedule item API performance — eliminated duplicate getUser() calls, parallelized admin check + payments check + cleanup queries (Promise.all), made audit logs fire-and-forget; reduced ~7s to ~1-2s | `api/projects/[projectId]/schedules/route.ts`, `api/projects/[projectId]/schedules/[id]/route.ts` | None — code fix only |
| May 2026 | Fix payment deletion blocked by payment_proofs FK — nullify payment_id on linked payment_proofs before deleting payment; also optimized with same perf pattern (inline admin check, parallel queries, fire-and-forget audit) | `api/projects/[projectId]/payments/[id]/route.ts` | None — code fix only |
| May 2026 | Remove Status Override from Edit Installment dialog — status is auto-calculated based on payments, no manual override | `(project-admin)/[projectId]/payments/tabs/ScheduleTab.tsx` | None — UI only |
| May 2026 | Auto-recalculate schedule item status on edit — PATCH now recalculates UPCOMING/DUE/OVERDUE/PAID/PARTIALLY_PAID based on new due_date, amount, and existing payments; returns full joined data for instant UI update | `api/projects/[projectId]/schedules/[id]/route.ts` | None — code fix only |
| May 2026 | Fix Record Payment not reflecting instantly — replaced router.refresh() with callback pattern; PaymentsClient now manages allScheduleItems state; schedule item status updates on payment; ScheduleTab syncs local state via useEffect | `(project-admin)/[projectId]/payments/tabs/RecordPaymentTab.tsx`, `(project-admin)/[projectId]/payments/PaymentsClient.tsx`, `(project-admin)/[projectId]/payments/tabs/ScheduleTab.tsx` | None — code fix only |
| May 2026 | Fix schedule item status not updating after payment deletion — handlePaymentDeleted finds deleted payment's schedule_item_id and recalculates status (OVERDUE/DUE/UPCOMING) if paid amount drops to 0 | `(project-admin)/[projectId]/payments/PaymentsClient.tsx` | None — code fix only |
| May 2026 | Add Waive Penalty option to inline Record Payment dialog on Collection Schedule — shows penalty amount and checkbox to waive when item has active penalties; fixed payDialogItem null crash with optional chaining | `(project-admin)/[projectId]/payments/tabs/ScheduleTab.tsx` | None — UI only |
| May 2026 | Defaulters page — each overdue item shown as separate row instead of grouped by shareholder; columns: shareholder, milestone, due date, expected, paid, due, penalty, actions | `(project-admin)/[projectId]/defaulters/DefaultersClient.tsx` | None — UI only |
| May 2026 | Defaulters page instant update on waive — tracks waived penalty IDs in a Set state; useMemo filters them out, triggering instant re-render without page reload | `(project-admin)/[projectId]/defaulters/DefaultersClient.tsx` | None — code fix only |
| May 2026 | Defaulters page show milestone data — added milestone:milestones(id, name) join to server query so column displays actual milestone name instead of "General" | `(project-admin)/[projectId]/defaulters/page.tsx` | None — code fix only |
| May 2026 | Fix expenses not showing instantly after add/edit/submit — replaced router.refresh() with onSave callback; POST and PUT APIs now return nested category+milestone joins; ExpensesClient updates local state on save | `expenses/ExpenseForm.tsx`, `expenses/ExpensesClient.tsx`, `api/projects/[projectId]/expenses/route.ts`, `api/projects/[projectId]/expenses/[id]/route.ts` | None — code fix only |
| May 2026 | Expense detail modal for Project Admin — clicking expense title or eye icon opens ExpenseDetailModal instead of navigating to separate page; supports submit, publish, delete, edit actions with instant local state sync | `expenses/ExpenseDetailModal.tsx` (NEW), `expenses/ExpensesClient.tsx` | None — UI only |
| May 2026 | Performance #12 — Enable gzip/brotli compression | `next.config.ts` — added `compress: true` | None |
| May 2026 | Performance #10 — Rate limiting on all API endpoints via proxy; 60 req/min general, 20 req/min on upload paths (`/api/projects/`, `/api/profile/avatar`); returns 429 with Retry-After header; keyed by IP | `src/proxy.ts` | None |
| May 2026 | Performance #9 — Parallel permission queries in `requireProjectMember`; replaced sequential awaits with `Promise.all` for shareholder + admin check | `src/lib/permissions.ts` | None |
| May 2026 | Performance #8 — Report query limits: audit-log reduced from 1000→100 records, added `?from=` and `?to=` date filter params; expense-ledger capped at 100; defaulters capped at 100 | `api/.../reports/audit-log/route.ts`, `api/.../reports/expense-ledger/route.ts`, `api/.../reports/defaulters/route.ts` | None |
| May 2026 | Performance #7 — In-memory TTL cache (5 min) for project details, basic project fetch, and packages list; new `src/lib/cache.ts` utility (cacheGet, cacheSet, cacheInvalidate) | `src/lib/cache.ts` (NEW), `api/.../details/route.ts`, `api/projects/[projectId]/route.ts`, `api/packages/route.ts` | None |
| May 2026 | Performance #6 — Replace nested `.find()` array scans in details route with O(1) Map lookups; `profileById` Map for shareholder→profile merge, `shareholderById` Map for committee→shareholder merge | `api/.../details/route.ts` | None |
| May 2026 | Performance #11 — Move aggregations out of JS loops: reactions now use `count:id.count()` in DB select (no raw rows); project shareholder/admin counts use embedded `count` in single query (eliminates 2 extra parallel queries); collection-summary builds Maps before shareholder loop (O(n+m) instead of O(n×m)) | `api/.../posts/route.ts`, `api/projects/route.ts`, `api/.../reports/collection-summary/route.ts` | None |
| May 2026 | Performance #4 — Pagination (default 20, max 100) on all list GET endpoints; supports `?page=` and `?limit=` query params; response includes `total`, `page`, `limit`, `hasMore` | `api/.../expenses/route.ts`, `api/.../milestones/route.ts`, `api/.../documents/route.ts`, `api/.../payment-proofs/route.ts`, `api/packages/route.ts` | None |
| May 2026 | Performance #5 — Streaming file uploads: removed `file.arrayBuffer()` and `Buffer.from(arrayBuffer)` conversions; pass `File` (Blob) directly to Supabase storage — eliminates full file load into RAM before upload | `api/.../documents/route.ts`, `api/profile/avatar/route.ts`, `api/.../posts/media/route.ts` | None |
| May 2026 | Performance #3 — Combined 4 sequential permission round trips in `getProjectRole` into a single `Promise.all`; profile + admin + committee + shareholder queries all fire simultaneously; also reduced select fields to `id`-only on role tables | `src/lib/permissions.ts` | None |
| May 2026 | Performance #1 — Replaced `auth.admin.listUsers()` (fetches all users) with targeted `profiles` table lookup by email using `.maybeSingle()`; applies to both add-admin and add-shareholder flows | `api/.../admin/route.ts`, `api/.../shareholders/route.ts` | None |
| May 2026 | Performance #2 — Replaced N+1 penalty loop (up to 3 DB calls per item) with batch approach: single `.in()` read before loop, Map for O(1) lookup, then 3 parallel writes (batch insert, batch upsert, batch status update) regardless of item count; worst case 152 queries → 5 queries | `src/lib/penalty.ts` | None |
| May 2026 | Optimistic UI — Add Expense (was 13s): dialog closes immediately after expense POST succeeds; attachment upload + approval submit fire in background IIFE; table row appears instantly via `onSave` callback; smart upsert in `handleExpenseSaved` handles both insert and status update | `expenses/ExpenseForm.tsx`, `expenses/ExpensesClient.tsx` | None — UI pattern only |
| May 2026 | Optimistic UI — Add Custom Collection (was 6.5s): optimistic row built client-side from form data + temp ID; dialog closes instantly; background API fires; temp row replaced with real data on success or removed on failure | `payments/tabs/ScheduleTab.tsx` | None — UI pattern only |
| May 2026 | Optimistic UI — Record Payment (was 3s): modal closes immediately, local schedule item status updated optimistically; API fires in background; rollback on failure | `payments/tabs/RecordPaymentTab.tsx`, `payments/tabs/ScheduleTab.tsx` | None — UI pattern only |
| May 2026 | Optimistic UI — Upload Document (was 8s): optimistic row from File metadata (name, type, size) added instantly; dialog closes; file uploads to Supabase Storage in background; temp row replaced with real doc on success or removed on failure | `documents/DocumentsClient.tsx` | None — UI pattern only |
| May 2026 | Optimistic UI — Add Shareholder: removed `router.refresh()` (slow full server re-render); for create — optimistic row appears instantly using form data + temp ID, API fires in background, `mutate()` replaces temp with real data on success, `onRemove` rolls back on failure; for edit — local state updated immediately from reconstructed object, API syncs in background with revert on failure; status toggle + delete also update local state instantly | `shareholders/ShareholdersForms.tsx`, `shareholders/ShareholdersTable.tsx` | None — UI pattern only |
| May 2026 | Payment Model + Schedule Generator — Per-shareholder payment model (Monthly Fixed Amount + Milestone Based) added to Add/Edit Shareholder form; model displayed read-only in shareholder detail side panel (Project Admin) and on shareholder's own profile page; "Generate Schedule Items" button on Payments page runs engine: generates monthly items for next 12 months and/or milestone-linked items for all UPCOMING/IN_PROGRESS milestones, skipping duplicates; unit/flat field made optional on shareholder form | `shareholders/ShareholdersForms.tsx`, `shareholders/ShareholdersTable.tsx`, `api/.../shareholders/route.ts`, `api/.../shareholders/[shareholderId]/route.ts`, `api/.../generate-schedule/route.ts`, `payments/PaymentsClient.tsx`, `(shareholder)/my/profile/page.tsx`, `components/profile/ShareholderPaymentModelCard.tsx` (NEW), `api/.../page-data/shareholders/route.ts` (already had payment_model join) | New table: `shareholder_payment_models` with 5 RLS policies (SELECT×2 for admin+shareholder, INSERT, UPDATE, DELETE) |
| May 2026 | Payment Model form validation — at least one Payment Model option (Monthly Fixed Amount or Milestone Based) is mandatory when adding a new shareholder; editing an existing shareholder does not require it | `shareholders/ShareholdersForms.tsx` | None |
| May 2026 | Generate Schedule refinements — monthly items now only generated for due dates within the next 30 calendar days (not 12 months); milestone-based items skipped entirely if `milestone_amount` is null or 0 (no more ৳0 placeholder items) | `api/.../generate-schedule/route.ts` | None |
| May 2026 | Collection Schedule column rename — "Milestone" header → "Payment Type / Milestone"; fallback cell label "General" → "General (Monthly Payment)" to distinguish monthly installments from milestone-linked items | `payments/tabs/ScheduleTab.tsx` | None — UI only |
| May 2026 | Add Custom Collection multi-select shareholders — shareholder selector converted from single-select combobox to multi-select; popover stays open on each pick; count badge shows how many selected; one schedule item created per selected shareholder in parallel with individual optimistic rows | `payments/tabs/ScheduleTab.tsx` | None — UI + client logic only |
| May 2026 | Expense detail modal instant open — modal previously fetched all data from API on open (causing spinner); now accepts `initialExpense` prop from table row (already in memory) and renders immediately; API fetch fires in background to enrich with `attachments` + `approvals`; `ExpensesClient` passes expense object alongside ID when opening modal | `expenses/ExpenseDetailModal.tsx`, `expenses/ExpensesClient.tsx` | None — UI pattern only |
| May 2026 | Shareholder/Committee Defaulters table — rewritten to match Project Admin row-per-item structure (Shareholder, Payment Type/Milestone, Due Date, Expected, Paid, Due, Penalty); removed grouped-by-shareholder aggregation; added milestone join to page query; no Actions column | `(shareholder)/my/defaulters/DefaultersClient.tsx`, `(shareholder)/my/defaulters/page.tsx` | None — UI only + query join added |
| May 2026 | Expenses table — Milestone column + multi-select milestone filter dropdown for Project Admin and Shareholder views; admin data already included milestone join; shareholder page query updated to add `milestone:milestones(id,name)` join; milestones derived server-side and passed as prop | `expenses/ExpensesClient.tsx`, `(shareholder)/my/expenses/ShareholderExpensesClient.tsx`, `(shareholder)/my/expenses/page.tsx` | None — UI only + query join added |
| May 2026 | Shareholders page — remove Total/Active/Inactive count pills from above table; shareholder count now shown in shell page header title as "Shareholders — (N)" for both Project Admin and Shareholder views; implemented via `PageTitleContext` with `setPageTitleSuffix`; context provided by `ProjectDataProvider` (admin) and `(shareholder)/layout.tsx`; suffix cleared on unmount | `src/context/PageTitleContext.tsx` (NEW), `components/layouts/ProjectDataProvider.tsx`, `components/layouts/ProjectAdminShell.tsx`, `(shareholder)/layout.tsx`, `(project-admin)/[projectId]/shareholders/page.tsx`, `(project-admin)/[projectId]/shareholders/ShareholdersTable.tsx`, `(shareholder)/my/shareholders/ShareholdersList.tsx` | None — UI only |
| May 2026 | Shareholder detail side panel redesign — removed purple gradient hero header from all roles (Super Admin, Project Admin, Shareholder); replaced with plain business card style header (initials avatar with primary-container tint, on-surface name, outline unit label, themed status pill); Shareholder role no longer shows Opening Balance or Payment Model sections (financial details hidden from peer shareholders) | `(super-admin)/projects/[projectId]/page.tsx`, `(project-admin)/[projectId]/shareholders/ShareholdersTable.tsx`, `(shareholder)/my/shareholders/ShareholdersList.tsx` | None — UI only |
| May 2026 | Committee page — Governance & Approval Rules card moved from always-visible section to modal; new "Governance & Approval Rules" button (outline style) placed beside "Add Member" button; "Committee Members" heading and count badge removed from above table; committee table columns updated to Name, Email, Phone, Added Date, Quick Action (removed Unit/Flat column); modal contains rule selection (Majority Approval / Any Single Member) with Save and Cancel buttons | `(project-admin)/[projectId]/committee/CommitteeClient.tsx` | None — UI only |
| May 2026 | Shareholder info side panel — synchronized with Project Admin structure; now shows Contact (Email, Phone, WhatsApp, Present Address), Professional (Profession, Designation, Organization), and Shareholding (Unit/Flat, Ownership, Status); excludes Opening Balance and Payment Model (financial/billing details hidden from peer shareholders) | `(shareholder)/my/shareholders/ShareholdersList.tsx` | None — UI only |
| May 2026 | Milestone "Add Milestone" button styling — removed box container (p-6 rounded border bg-surface-container-low); button now uses primary styling (bg-primary hover:bg-primary) and sits in plain flex container matching other CTA buttons across app | `(project-admin)/[projectId]/milestones/MilestoneTimeline.tsx` | None — UI only |
| May 2026 | Expenses multi-select status filter — removed pipeline status badges from top of Expenses page; added dropdown filter beside "All Milestones" for Project Admin Expenses page; options: All (default), Draft, Submitted, Changes Req., Approved, Published, Rejected; uses same multi-select pattern as milestone filter (checkboxes, "Clear filter" option); bulk publish button shows when selected expenses are all APPROVED status | `(project-admin)/[projectId]/expenses/ExpensesClient.tsx` | None — UI only |
| May 2026 | Expenses multi-select category filter — added third filter dropdown beside status and milestone filters on Project Admin Expenses page; options: All (default), plus all expense categories for the project; uses same multi-select pattern as status and milestone filters (checkboxes, "Clear filter" option) | `(project-admin)/[projectId]/expenses/ExpensesClient.tsx` | None — UI only |
| May 2026 | Expenses search — added search input field above filters on Project Admin Expenses page; searches by expense title (case-insensitive); works alongside the three filter dropdowns (status, milestone, category) | `(project-admin)/[projectId]/expenses/ExpensesClient.tsx` | None — UI only |
| May 2026 | Shareholder Expenses filters & search consistency — updated Shareholder Expenses page to match Project Admin version; added search input field above filters; converted Category filter from single-select to multi-select dropdown; kept Milestone filter multi-select; both filters now use same checkbox pattern as Project Admin (All option, Clear filter button); filter layout reorganized to separate search from filter dropdowns | `(shareholder)/my/expenses/ShareholderExpensesClient.tsx` | None — UI only |
| May 2026 | Expenses date range filter — added "From Date" and "To Date" input fields in filter section on both Project Admin and Shareholder Expenses pages; includes "Clear dates" button to reset filter; filters expenses by published_at (shareholder) or date (project admin) within the date range | `(project-admin)/[projectId]/expenses/ExpensesClient.tsx`, `(shareholder)/my/expenses/ShareholderExpensesClient.tsx` | None — UI only |
| May 2026 | Expenses export report (CSV) — added "Export Report" button to Expenses page (both Project Admin and Shareholder); exports filtered expenses (respecting all active filters: search, date range, categories, milestones) as CSV file with filename `Expenses_Report_[Date].csv`; includes report period, total amount, and table with Date, Title, Category, Milestone, Amount columns; shareholder version excludes Status column | `(project-admin)/[projectId]/expenses/ExpensesClient.tsx`, `(shareholder)/my/expenses/ShareholderExpensesClient.tsx` | None — client-side export only |
| May 2026 | Payments milestone filter — added multi-select "Milestones" dropdown filter to Payment History tab on Project Admin Payments page; matches Expenses page milestone filter pattern; options: All Milestones (default), No Milestone, plus all project milestones; uses checkbox pattern with "Clear filter" button; filters payments by their associated schedule item's milestone | `(project-admin)/[projectId]/payments/tabs/AllPaymentsTab.tsx` | None — UI only |
| May 2026 | Collection Schedule milestone filter — added multi-select "Milestones" dropdown filter to Collection Schedule table on Project Admin Payments page; matches Expenses page milestone filter pattern; options: All Milestones (default), No Milestone, plus all project milestones; uses checkbox pattern with "Clear filter" button; filters schedule items by their milestone; filter placed next to Status filter | `(project-admin)/[projectId]/payments/tabs/ScheduleTab.tsx` | None — UI only |
| May 2026 | Payment History milestone column — added "Payment Type / Milestone" column to Payment History table on Project Admin Payments page; displays milestone name from associated schedule item or "General (Monthly Payment)" if no milestone; positioned after Shareholder column, before Method column | `(project-admin)/[projectId]/payments/tabs/AllPaymentsTab.tsx` | None — UI only |
| May 2026 | Truzo brand color palette — replaced entire MD3 purple palette with Truzo brand colors: primary #1B4FFF (blue CTA), secondary #00C2A8 (teal), tertiary #FF6B2B (orange CTA), background #F5F7FF, surface #FFFFFF, on-surface #1A1A2E, plus full semantic container tokens (success/warning/error) for both light and dark mode; `--accent` kept as #EEF2FF for shadcn/ui hover states (orange mapped to `--tertiary` instead to avoid breaking dropdowns) | `src/app/globals.css` | None — styling only |
| May 2026 | Global text-outline fix — `--m3-outline: #E5E8F0` is a border color, completely unreadable as text; replaced all 33 occurrences of `text-outline` with `text-on-surface-variant` across all tsx files (excluding marketing/node_modules) | 33 files via sed | None — styling only |
| May 2026 | Status badge semantic colors — updated all status badge classes across expenses, payments, shareholder pages to use proper semantic container tokens after palette change (APPROVED=success, SUBMITTED=secondary, CHANGES_REQUESTED=warning, REJECTED=error, PUBLISHED=primary, PARTIALLY_PAID=warning, PENDING=warning, DUE=secondary, OVERDUE=error, PAID=success) | `expenses/ExpensesClient.tsx`, `expenses/ExpenseDetailModal.tsx`, `expenses/[id]/ExpenseDetailClient.tsx`, `payments/tabs/WaitingForApprovalTab.tsx`, `payments/tabs/ScheduleTab.tsx`, `payments/tabs/RecordPaymentTab.tsx`, `payments/PaymentsClient.tsx`, `(shareholder)/my/payments/ShareholderPaymentsClient.tsx`, `(shareholder)/my/payments/SubmitPaymentProofModal.tsx`, `components/NotificationBell.tsx`, `(shareholder)/my/review/ReviewClient.tsx` | None — styling only |
| May 2026 | Dashboard icon backgrounds — after palette change, icon containers using `bg-primary-container/20` became invisible (20% opacity of #E8EDFF on #F5F7FF background); replaced with distinct full-opacity semantic containers per icon type; blue (`bg-primary-container`) reserved for CTA buttons only, not icon backgrounds; quick actions, financial health cards, and pipeline rows all updated | `(project-admin)/[projectId]/dashboard/page.tsx` | None — styling only |
| May 2026 | Fix "extra white background" on Milestone page — outer timeline container had `bg-[var(--surface)]` creating a white box on #F5F7FF page background; removed background, updated ring colors from `ring-[var(--surface)]` to `ring-background`, updated milestone dot/card colors to semantic tokens (completed=success-container, in-progress=secondary-container) | `milestones/MilestoneTimeline.tsx` | None — styling only |
| May 2026 | Fix "extra white background" on Project Update Feed page — feed cards used `bg-surface`/`bg-card` (#FFFFFF) creating visible white boxes; removed background from AdminPostCard outer wrapper and CreatePostForm compose trigger; both now transparent with just border | `feed/AdminPostCard.tsx`, `feed/CreatePostForm.tsx` | None — styling only |
| May 2026 | Fix "extra white background" on Settings page — outer tab container had `bg-surface border` creating white box; replaced with `border border-outline-variant/40` (no background) | `settings/ProjectSettingsClient.tsx` | None — styling only |
| May 2026 | Fix ForShareholders landing page mockup — ৳18,50,000 amount text inside blue card had no explicit color class and was unreadable; added `text-white` explicitly | `src/components/marketing/ForShareholders.tsx` | None — styling only |
| May 2026 | Logo consistency across entire app — landing page Nav logo: white on hero, blue (#1B4FFF) on scroll; all app shells/pages now use identical style `text-[22px] font-bold text-[#1B4FFF] tracking-tight`; replaced SVG logo in ProjectAdminShell and shareholder layout with text; fixed `font-normal` → `font-bold` on login page and SuperAdminShell | `src/components/marketing/Nav.tsx`, `src/components/layouts/ProjectAdminShell.tsx`, `src/app/(shareholder)/layout.tsx`, `src/components/layouts/SuperAdminShell.tsx`, `src/app/(auth)/login/page.tsx` | None — styling only |
| May 2026 | Performance — Local data caching (Step 1): added `cacheInvalidatePrefix()` to `cache.ts`; shell route (`/api/projects/[projectId]/shell`) cached 5 min by `shell:[projectId]:[userId]`; committee page-data cached 5 min by `committee:[projectId]`, invalidated on member add/remove; packages GET already cached per-page, POST+PUT now call `cacheInvalidatePrefix("packages:")` to bust all pages on write | `src/lib/cache.ts`, `api/projects/[projectId]/shell/route.ts`, `api/projects/[projectId]/page-data/committee/route.ts`, `api/projects/[projectId]/committee/route.ts`, `api/projects/[projectId]/committee/[memberId]/route.ts`, `api/packages/route.ts`, `api/packages/[id]/route.ts` | None |
| May 2026 | Performance — Request optimization (Step 2): converted sequential `await` DB calls to `Promise.all` in 3 shareholder server pages — dashboard (profile+shareholder in parallel, then 4 data queries in parallel), payments (3 queries in parallel), milestones (2 queries in parallel) | `(shareholder)/my/dashboard/page.tsx`, `(shareholder)/my/payments/page.tsx`, `(shareholder)/my/milestones/page.tsx` | None |
| May 2026 | Performance — Loading skeletons (Step 3): created 18 new `loading.tsx` files for all routes missing them — shareholder: payments, feed, milestones, expenses, documents, defaulters, shareholders, review, profile; super-admin: dashboard, admins, packages, projects, projects/[projectId], profile; project-admin: profile, expenses/[id], payments/[id]/receipt. Each skeleton matches the real page's content shape with pulse animation | 18 new `loading.tsx` files across `(shareholder)/my/*`, `(super-admin)/*`, `(project-admin)/[projectId]/*` | None |
| May 2026 | Performance — Page preloading (Step 4): added `prefetch={true}` to every `<Link>` in all 3 navigation shells (ProjectAdminShell 12 links + profile footer, SuperAdminShell 3 links + profile footer, shareholder layout 9 links including committee section + profile footer); forces route bundle + loading skeleton prefetch on sidebar mount instead of waiting for viewport | `components/layouts/ProjectAdminShell.tsx`, `components/layouts/SuperAdminShell.tsx`, `(shareholder)/layout.tsx` | None |
| May 2026 | Performance — Optimistic UI updates (Step 5): expense single publish now updates row status to PUBLISHED immediately before API call, reverts to APPROVED on error; bulk publish flips all selected rows instantly, reverts + restores selection on error; admin post hide/show toggle changes card appearance immediately, reverts on error (uses `originalStatus` captured before optimistic update) | `(project-admin)/[projectId]/expenses/ExpensesClient.tsx`, `(project-admin)/[projectId]/feed/AdminPostCard.tsx` | None |
| May 2026 | Performance — Image & asset optimization (Step 6): configured Supabase storage domain (`mjnuxgdyegyqsfgkssva.supabase.co`) in `next.config.ts` `remotePatterns`; converted post media `<img>` tags to Next.js `<Image>` in both feed card components — auto WebP/AVIF conversion, proper srcset, lazy loading by default; lightbox image kept as `<img>` with `loading="lazy"` | `next.config.ts`, `(project-admin)/[projectId]/feed/AdminPostCard.tsx`, `(shareholder)/my/feed/PostCard.tsx` | None |
| May 2026 | Performance — Code splitting (Step 7): converted 8 heavy modal/form components from static imports to `next/dynamic` with `ssr: false` — ExpenseForm (293 lines) and ExpenseDetailModal (322 lines) in ExpensesClient; CreatePostForm (449 lines) in FeedClient; ShareholderDialog (476 lines) in ShareholdersTable; SubmitPaymentProofModal (258 lines) in ShareholderPaymentsClient; PackageDialog (224 lines) in packages/page; ProjectDialog (345 lines) and CreateAdminDialog (190 lines) in projects/page; ~2,557 lines of modal code now in separate lazy chunks | `expenses/ExpensesClient.tsx`, `feed/FeedClient.tsx`, `shareholders/ShareholdersTable.tsx`, `(shareholder)/my/payments/ShareholderPaymentsClient.tsx`, `(super-admin)/packages/page.tsx`, `(super-admin)/projects/page.tsx` | None |
| May 2026 | Shareholders table column reduction — Project Admin table shows only Name, Phone, Email, Status, Actions; Shareholder table shows only Name, Phone, Email; all detail info (Unit/Flat, Ownership, Opening Balance, Payment Model, Professional, etc.) moved to side panel only | `(project-admin)/[projectId]/shareholders/ShareholdersTable.tsx`, `(shareholder)/my/shareholders/ShareholdersList.tsx` | None — UI only |
| May 2026 | Fix "duplicate key value violates unique constraint shareholders_project_id_unit_flat_key" — when unit_flat is left blank the form sends empty string ""; PostgreSQL treats two empty strings as duplicates; coerce `unit_flat || null` before insert so blank fields store NULL (multiple NULLs are allowed by the unique constraint) | `api/projects/[projectId]/shareholders/route.ts` | None — code fix only |
| May 2026 | Payment History redesign — Project Admin table: columns reduced to Date Recorded, Shareholder (name+phone, clickable), Payment Type/Milestone, Amount, Proof, Actions (Edit+Delete icons); clicking shareholder name opens a right-side panel with full payment detail (Receipt #, Date, Milestone, Method, Reference, Notes, Amount, Proof, Download Receipt button, Edit/Delete actions); Shareholder table: columns reduced to Date Recorded, Payment Type/Milestone, Amount, Proof, Action (Download Receipt button); removed Receipt #, Method, Reference columns from both views | `payments/tabs/AllPaymentsTab.tsx`, `(shareholder)/my/payments/ShareholderPaymentsClient.tsx` | None — UI only |
| May 2026 | Fix OVERDUE status not updating after payment — (1) partial payment of OVERDUE item was incorrectly becoming PARTIALLY_PAID; fixed status recalculation everywhere to use due_date-based logic (PAID if totalPaid ≥ amount, else OVERDUE/DUE/UPCOMING); (2) schedule_item UPDATE in payments route used `supabase` (RLS client) which was silently blocked — switched to `getSupabaseAdmin()`; (3) Project Admin ScheduleTab now computes display status via `getComputedStatus()` derived from actual paid amounts rather than reading stale `item.status` from DB — badge, row highlight, Pay button, and status filter all use computed value; (4) Shareholder My Collection Schedule applies the same inline `computedStatus` logic; (5) handleProofApproved now also updates allScheduleItems | `api/projects/[projectId]/payments/route.ts`, `payments/tabs/ScheduleTab.tsx`, `payments/PaymentsClient.tsx`, `(shareholder)/my/payments/ShareholderPaymentsClient.tsx` | None — code fix only |

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
