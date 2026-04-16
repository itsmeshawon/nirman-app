# NirmaN — Project Reference Document
> Construction Transparency Platform  
> Last updated: April 2026  
> Use this file at the start of every new Claude conversation as context.

---

## 1. Project Overview

**NirmaN** is a SaaS platform for construction project transparency. It connects:
- **Super Admins** (platform owners) who manage all projects
- **Project Admins** who manage day-to-day project operations
- **Shareholders** (buyers/investors) who track their payments, milestones, and documents

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, Server Components) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| UI | Tailwind CSS + shadcn/ui |
| Tables | TanStack React Table |
| Notifications | Sonner (toast) |
| Icons | Lucide React |

---

## 3. Supabase Config

```
Project ID:     mjnuxgdyegyqsfgkssva
URL:            https://mjnuxgdyegyqsfgkssva.supabase.co
Anon Key:       eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Env file: `.env.local` (root of project)

### Supabase Clients
| File | Purpose |
|------|---------|
| `src/lib/supabase/server.ts` | Server-side client (respects RLS) |
| `src/lib/supabase/client.ts` | Client-side browser client |
| `src/lib/supabase/admin.ts` | Service role client (bypasses RLS) — use for system queries |
| `src/lib/supabase/middleware.ts` | Auth middleware |

> **IMPORTANT PATTERN:** Many pages use `supabaseAdmin` for fetching data because RLS policies block certain reads even for authorized users. This is intentional and safe because auth is verified first.

---

## 4. User Roles

Defined in `profiles.role` column (enum: `global_role`):

| Role | Description | Login Redirects To |
|------|-------------|-------------------|
| `SUPER_ADMIN` | Platform owner | `/dashboard` (super admin layout) |
| `PROJECT_ADMIN` | Manages one or more projects | `/:projectId/dashboard` |
| `SHAREHOLDER` | Buyer/investor in a project | `/my/dashboard` |
| `FINANCE_STAFF` | ⚠️ Defined in DB but feature NOT implemented yet | N/A |

---

## 5. Directory Structure

```
src/
├── app/
│   ├── (auth)/                    # Login page
│   ├── (super-admin)/             # Super admin dashboard
│   │   ├── dashboard/
│   │   ├── projects/              # All projects list + create/delete
│   │   │   └── [projectId]/       # Project detail (admins, shareholders)
│   │   ├── admins/                # Global admins list
│   │   ├── packages/              # Subscription packages
│   │   └── profile/
│   ├── (project-admin)/
│   │   └── [projectId]/           # Project-scoped admin views
│   │       ├── dashboard/
│   │       ├── shareholders/      # Manage shareholders
│   │       ├── committee/         # Committee members
│   │       ├── milestones/        # Project milestones
│   │       ├── payments/          # Record & track payments
│   │       ├── expenses/          # Expense management with approvals
│   │       ├── feed/              # Activity posts
│   │       ├── documents/         # Project documents
│   │       ├── reports/           # Audit log, defaulters, expense ledger
│   │       ├── settings/          # Project settings
│   │       └── layout.tsx         # Auth gate (uses supabaseAdmin for project fetch)
│   ├── (shareholder)/
│   │   └── my/                    # Shareholder views (read-only)
│   │       ├── dashboard/         # Uses supabaseAdmin for shareholder fetch
│   │       ├── feed/              # Uses supabaseAdmin for shareholder fetch
│   │       ├── payments/
│   │       ├── milestones/
│   │       ├── expenses/
│   │       ├── documents/
│   │       └── shareholders/      # View fellow shareholders
│   └── api/                       # All API routes
│       ├── projects/
│       │   └── [projectId]/
│       │       ├── route.ts        # GET project, DELETE project
│       │       ├── shareholders/   # CRUD shareholders
│       │       ├── admin/          # Assign/remove project admins
│       │       ├── committee/      # Committee management
│       │       ├── milestones/     # Milestone CRUD
│       │       ├── payments/       # Record payments
│       │       ├── expenses/       # Expense lifecycle
│       │       ├── posts/          # Activity feed
│       │       ├── documents/      # Document upload
│       │       ├── reports/        # Report endpoints
│       │       ├── penalty-config/ # Penalty configuration
│       │       ├── penalties/      # Apply/waive penalties
│       │       ├── schedules/      # Payment schedules
│       │       └── settings/       # Project settings
│       ├── super-admin/admins/     # Create global admins
│       ├── packages/               # Package CRUD
│       ├── profile/                # Profile update + avatar
│       └── notifications/          # Notification management
├── lib/
│   ├── permissions.ts             # Auth helpers: requireProjectAdmin, requireRole etc.
│   ├── audit.ts                   # logAction() for audit trail
│   ├── notifications.ts           # Notification helpers
│   ├── penalty.ts                 # Penalty calculation logic
│   ├── utils.ts                   # formatBDT, formatDate, cn()
│   └── validations.ts
└── components/
    ├── layouts/
    │   ├── ProjectAdminShell.tsx
    │   └── ShareholderShell.tsx
    ├── super-admin/
    │   ├── CreateProjectDialog.tsx
    │   └── CreateAdminDialog.tsx
    └── ui/                        # shadcn/ui components
```

---

## 6. Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | All users (linked to auth.users) |
| `projects` | Construction projects |
| `packages` | Subscription packages linked to projects |
| `project_admins` | Links users to projects as admins |
| `shareholders` | Links users to projects as shareholders |
| `committee_members` | Shareholders with approval rights on expenses |
| `milestones` | Project construction milestones |
| `payment_schedules` | Payment schedule config (monthly/milestone) |
| `schedule_items` | Individual payment due items per shareholder |
| `payments` | Recorded payments |
| `penalties` | Late payment penalties |
| `penalty_configs` | Penalty rules per project |
| `expenses` | Project expenses (draft → published lifecycle) |
| `expense_categories` | Categories for expenses |
| `expense_attachments` | Files attached to expenses |
| `expense_approvals` | Committee member approvals on expenses |
| `activity_posts` | Feed posts (with media) |
| `reactions` | Reactions on posts |
| `post_views` | View tracking on posts |
| `project_documents` | Documents uploaded to project |
| `approval_configs` | Expense approval rule (MAJORITY / ANY_SINGLE) |
| `notification_configs` | Notification settings per project |
| `notifications` | In-app notifications |
| `audit_logs` | Full audit trail of all actions |

**Live Data (as of April 2026):**
- Projects: 2 (Homelink Atifa Palace, Green Valley Heights)
- Shareholders: 25
- Project Admins: 2
- Committee Members: 6
- Milestones: 10+
- Expenses: 9
- Payments: 7

---

## 7. Key Enums

```sql
global_role:       SUPER_ADMIN, PROJECT_ADMIN, FINANCE_STAFF, SHAREHOLDER
project_status:    PILOT, ACTIVE, ARCHIVED
shareholder_status: ACTIVE, INACTIVE
milestone_status:  UPCOMING, IN_PROGRESS, COMPLETED
expense_status:    DRAFT, SUBMITTED, CHANGES_REQUESTED, REJECTED, APPROVED, PUBLISHED
payment_method:    CASH, BANK_TRANSFER, BKASH, NAGAD, CHEQUE
due_status:        UPCOMING, DUE, OVERDUE, PAID, PARTIALLY_PAID
schedule_type:     MONTHLY, MILESTONE, MIXED
```

---

## 8. RLS Policy Rules

> **Critical Context:** RLS policies use explicit `EXISTS` subqueries. Function-based policies (`is_project_admin()`, `is_project_member()`) exist but had bugs fixed.

### Key RLS Patterns
```sql
-- Project Admins access their project data
EXISTS (SELECT 1 FROM project_admins 
        WHERE project_id = <table>.project_id 
        AND user_id = auth.uid())

-- Shareholders view own record
user_id = auth.uid()

-- Super Admins (via supabaseAdmin client, bypasses RLS)
```

### Fixed Functions
- `is_project_member(p_project_id UUID)` — checks project_admins + shareholders (finance_staff reference REMOVED)

### Tables Using supabaseAdmin (bypass RLS in code)
These pages/layouts use `supabaseAdmin` because RLS was blocking valid reads:
- `src/app/(project-admin)/[projectId]/layout.tsx` — fetch project details
- `src/app/(project-admin)/[projectId]/committee/page.tsx` — fetch committee + shareholders
- `src/app/(shareholder)/my/dashboard/page.tsx` — fetch shareholder record
- `src/app/(shareholder)/my/feed/page.tsx` — fetch shareholder record

---

## 9. Auth & Routing Logic

### Login Flow
1. User logs in at `/login`
2. Middleware checks `profiles.role`
3. Redirected based on role:
   - `SUPER_ADMIN` → `/dashboard`
   - `PROJECT_ADMIN` → `/:projectId/dashboard`
   - `SHAREHOLDER` → `/my/dashboard`

### Authorization Pattern in API Routes
```typescript
// 1. Auth check
const { data: { user } } = await supabase.auth.getUser()
if (!user) return 401

// 2. Role check (use supabaseAdmin for reliability)
const { data: profile } = await supabaseAdmin
  .from("profiles").select("role").eq("id", user.id).single()
if (profile.role !== "SUPER_ADMIN") return 403

// 3. Business logic using supabaseAdmin
```

---

## 10. Known Fixes Applied (History)

| Issue | Fix |
|-------|-----|
| Finance Staff SQL broke whole app | Dropped finance_staff table, removed all RLS policies it added to payments/expenses/activity_posts/expense_attachments |
| `is_project_member()` function broke milestones | Removed finance_staff reference from function |
| Shareholder saw "No Project Assigned" | Changed shareholder query to use `supabaseAdmin` in dashboard and feed pages |
| Project Admin saw "Project not found" | Changed project fetch in layout.tsx to use `supabaseAdmin` |
| Committee member RLS policies broken | Replaced function-based policies with explicit EXISTS subqueries |
| Shareholders INSERT RLS missing WITH CHECK | Recreated with proper `WITH CHECK` clause |
| Milestone didn't appear after creation | Removed `router.refresh()` that was overwriting local state update |
| Project deletion failed (FK constraint) | Moved audit_logs deletion first in cascade order |

---

## 11. Finance Staff Feature (NOT IMPLEMENTED)

> ⚠️ The `FINANCE_STAFF` role exists in the `global_role` enum but the feature is NOT built yet.
> 
> **Do NOT add a finance_staff table or RLS policies** until the feature is ready to implement properly.
> 
> When implementing later:
> - Use explicit RLS policy syntax (separate SELECT/INSERT/UPDATE/DELETE)
> - Do NOT use `FOR ALL USING(...)` for INSERT operations
> - Do NOT reference finance_staff in is_project_member() function
> - Implement authorization in API routes, not just RLS

---

## 12. Utility Functions (src/lib/utils.ts)

```typescript
formatBDT(amount)       // Format as Bangladeshi Taka
formatDate(date)        // Format date string
cn(...classes)          // Tailwind class merge
```

---

## 13. Audit Logging

All major actions are logged via `logAction()` from `src/lib/audit.ts`:

```typescript
await logAction({
  userId: user.id,
  projectId: projectId,        // optional
  action: "CREATE_MILESTONE",  // action name
  entityType: "milestone",
  entityId: data.id,
  details: { name }            // any extra info
})
```

---

## 14. Terminal Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000

# Production
npm run build        # Build for production
npm run start        # Run production build

# Dependencies
npm install          # Install packages
```

---

## 15. Project Files Location

```
/Users/shawon/Desktop/personal-projects/NirmanApp/
├── .claude/worktrees/cool-mestorf/     # Active working directory
│   ├── src/                            # Source code
│   ├── .env.local                      # Environment variables
│   └── package.json
└── PROJECT_REFERENCE.md               # This file
```

---

*When starting a new Claude conversation, share this file and say: "Here is my project reference. Continue helping me with NirmaN."*
