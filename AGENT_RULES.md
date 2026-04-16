# AGENT RULES — NirmaN Project
> Read this BEFORE starting any task. Pair with NIRMAN_CONTEXT.md.
> Version: 2.0 | Updated: April 2026

---

## STEP 0 — LOAD CONTEXT (Every Single Time)

```
1. Read NIRMAN_CONTEXT.md — full file, no skipping
2. Read this file — all rules apply to every task
3. Identify which task type you are doing (see Task Types below)
4. Run the checklist for that task type before writing any code
```

---

## STEP 1 — ANNOUNCE YOUR PLAN

Before writing a single line of code, output this block:

```
## Task: [name of what you are building]
## Type: [New Feature | Bug Fix | DB Migration | UI Change | API Change]

**Files I will create or modify:**
- src/app/...
- src/app/api/...

**DB changes needed:**
- New tables: [name] or None
- New columns: [table.column] or None
- New RLS policies: [description] or None
- New enums: [values] or None

**FK/column verification needed:**
- [table] → I will check that [column] exists before writing delete/join queries

**Authorization path:**
- Who can do this: [SUPER_ADMIN | PROJECT_ADMIN | SHAREHOLDER | all]
- Check method: [requireProjectAdmin | profile.role check | requireCommitteeMember]

**State management:**
- Does UI need instant update after action? [Yes → no router.refresh() | No]

**Conflicts or risks:**
- [any] or None

Ready to proceed.
```

---

## STEP 2 — PRE-FLIGHT CHECKS (Before Writing Code)

### For any query that touches child tables (delete, join, filter):
**Check the FK Reference in NIRMAN_CONTEXT.md Section 6B first.**
Do NOT assume a table has `project_id`. Many child tables link through a parent.

Quick verification query when unsure:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'YOUR_TABLE'
ORDER BY ordinal_position;
```

### For any new RLS policy:
- Confirm the policy type (SELECT / INSERT / UPDATE / DELETE — never FOR ALL)
- Confirm the table has the FK you're referencing in the EXISTS check

### For any new page:
- Confirm which layout it belongs to (super-admin / project-admin / shareholder)
- Confirm whether RLS will block the query → if yes, document the supabaseAdmin bypass

---

## STEP 3 — BUILD IT

Follow the task-type checklist below.

---

## TASK TYPE CHECKLISTS

### ▸ New Feature (Page + API)

- [ ] Server page created in correct route group
- [ ] Client component created for interactive parts (`"use client"`)
- [ ] API route created with auth → authorization → validate → DB → audit pattern
- [ ] Authorization matches the role access matrix (Section below)
- [ ] Uses `supabaseAdmin` where RLS would block — documented in NIRMAN_CONTEXT.md §11
- [ ] Client state updates use `prev => [...]` — no `router.refresh()` after state set
- [ ] UI uses design tokens only — no hardcoded hex colors
- [ ] Toast feedback on success and error (Sonner)
- [ ] Audit log on all mutations (`logAction()`)
- [ ] NIRMAN_CONTEXT.md updated

### ▸ Bug Fix

- [ ] Root cause identified (RLS? wrong client? router.refresh? FK missing?)
- [ ] Fix is targeted — does not change unrelated code
- [ ] Verified the fix doesn't break adjacent features
- [ ] Added to Feature Log in NIRMAN_CONTEXT.md

### ▸ DB Migration (New Table / Column / Policy)

- [ ] Pre-flight: checked if table/column already exists
- [ ] RLS: separate policy per operation (SELECT, INSERT, UPDATE, DELETE)
- [ ] INSERT policy uses `WITH CHECK`, not `USING`
- [ ] No reference to `finance_staff` table
- [ ] No `FOR ALL USING(...)` syntax
- [ ] Cascade delete order updated in NIRMAN_CONTEXT.md §8D if new table added
- [ ] FK Reference table updated in NIRMAN_CONTEXT.md §6B

### ▸ UI-Only Change

- [ ] Uses design tokens from NIRMAN_CONTEXT.md §4
- [ ] No hardcoded colors
- [ ] Client component if interactive, Server if display-only
- [ ] Responsive (mobile-first)

### ▸ API-Only Change

- [ ] Auth check first (always)
- [ ] Role check second (always)
- [ ] Input validation before DB operation
- [ ] Error returned with correct HTTP status codes
- [ ] Audit log on mutations

---

## HARD RULES — NEVER BREAK THESE

| Rule | Why It Matters |
|------|---------------|
| Never `router.refresh()` after a client state update | Overwrites local state with stale server data — UI change disappears |
| Never use `FOR ALL USING(...)` for RLS | Breaks INSERT operations entirely |
| Never reference `finance_staff` table in any SQL | Table does not exist — crashes RLS functions |
| Never call `supabaseAdmin` without verifying auth first | Security hole — bypasses all access control |
| Never hardcode colors in UI | Breaks dark mode + design system consistency |
| Always delete `audit_logs` FIRST in cascade deletes | It has FK to projects — deleting project first causes constraint error |
| Always use `prev => [...]` functional update in React | Prevents stale closure bugs |
| Never assume a child table has `project_id` | Many link through parent IDs — check FK Reference first |
| Never add partial Finance Staff implementation | Half-built feature broke the entire app before — do it fully or not at all |

---

## ROLE × FEATURE ACCESS MATRIX

Use this to determine authorization for any new API route or page.

| Feature | SUPER_ADMIN | PROJECT_ADMIN | SHAREHOLDER |
|---------|------------|--------------|-------------|
| Create / delete projects | ✅ | ❌ | ❌ |
| Assign project admins | ✅ | ❌ | ❌ |
| Manage packages | ✅ | ❌ | ❌ |
| View project details | ✅ | ✅ (own) | ✅ (own) |
| Manage shareholders | ✅ | ✅ | ❌ |
| Manage milestones | ✅ | ✅ | ❌ |
| View milestones | ✅ | ✅ | ✅ |
| Create/edit expenses | ✅ | ✅ | ❌ |
| Approve/reject expenses | ❌ | ❌ | ✅ (committee only) |
| View expenses | ✅ | ✅ | ✅ (PUBLISHED only) |
| Record payments | ✅ | ✅ | ❌ |
| View payments | ✅ | ✅ | ✅ (own only) |
| Manage committee | ✅ | ✅ | ❌ |
| Post to feed | ✅ | ✅ | ❌ |
| View feed | ✅ | ✅ | ✅ |
| Upload documents | ✅ | ✅ | ❌ |
| View documents | ✅ | ✅ | ✅ |
| View audit logs | ✅ | ✅ (own project) | ❌ |
| View reports | ✅ | ✅ | ❌ |

---

## RLS AUTHORING RULES

```sql
-- ✅ CORRECT — SELECT
CREATE POLICY "Project admins can view X" ON table_name
FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_admins
          WHERE project_admins.project_id = table_name.project_id
          AND project_admins.user_id = auth.uid())
);

-- ✅ CORRECT — INSERT (WITH CHECK, not USING)
CREATE POLICY "Project admins can insert X" ON table_name
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM project_admins
          WHERE project_admins.project_id = table_name.project_id
          AND project_admins.user_id = auth.uid())
);

-- ❌ WRONG — never use FOR ALL
CREATE POLICY "bad" ON table_name FOR ALL USING (...);

-- ❌ WRONG — INSERT must not use USING
CREATE POLICY "bad" ON table_name FOR INSERT USING (...);
```

---

## STANDARD API ROUTE PATTERN

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await props.params
  try {
    // 1. Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 2. Authorization
    try { await requireProjectAdmin(supabase, projectId) }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    // 3. Validate input
    const body = await request.json()
    if (!body.requiredField) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    // 4. DB operation
    const { data, error } = await supabaseAdmin
      .from("table").insert({ ...body, project_id: projectId }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // 5. Audit log
    await logAction({
      userId: user.id, projectId,
      action: "CREATE_X", entityType: "x", entityId: data.id,
      details: { name: body.name }
    }).catch(err => console.error("Audit failed:", err))

    // 6. Return
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

---

## STANDARD CLIENT STATE UPDATE

```typescript
// ✅ After POST — append new item
const data = await res.json()
setItems(prev => [...prev, data.data])

// ✅ After PATCH — update existing item
setItems(prev => prev.map(item => item.id === id ? { ...item, ...data.data } : item))

// ✅ After DELETE — remove item
setItems(prev => prev.filter(item => item.id !== id))

// ❌ NEVER do this after any of the above
router.refresh()  // Resets state back to server data
```

---

## STEP 4 — AFTER COMPLETING ANY TASK

Update `NIRMAN_CONTEXT.md`:

1. **Feature Log (§12)** — Add a row: `| [date] | [feature] | [files changed] | [DB changes] |`
2. **App Structure (§5)** — Add any new files/routes
3. **Database Schema (§6)** — Add new tables, columns, enums
4. **FK Reference (§6B)** — Add any new FK relationships
5. **RLS Policies (§7)** — Document new policies
6. **Business Logic (§8)** — Document new workflows
7. **supabaseAdmin Bypasses (§11)** — Document any new bypasses
8. **Unimplemented Features (§10)** — Update status if relevant

Then confirm:
```
✅ [Feature name] complete.
Files changed: [list]
NIRMAN_CONTEXT.md updated: [sections updated]
```

---

## HOW TO START A NEW CLAUDE CONVERSATION

Paste this exactly:

> "Read NIRMAN_CONTEXT.md and AGENT_RULES.md in /Users/shawon/Desktop/personal-projects/NirmanApp/ — these are the source of truth for my project. Then help me with: [your task]"

---

## COMMON MISTAKES LOG
> Things that actually happened and cost time. Don't repeat them.

| Mistake | What Happened | Prevention |
|---------|--------------|------------|
| Assumed `reactions` had `project_id` | Cascade delete silently failed, FK error blocked project deletion | Always check FK Reference (§6B) before writing delete queries |
| Used `router.refresh()` after `setMilestones()` | New milestone disappeared after creation — state reset to server data | Never call `router.refresh()` after a client state update |
| `FOR ALL USING(...)` on shareholders INSERT | RLS blocked all shareholder creation — `qual: null` in policy | Always use `FOR INSERT WITH CHECK(...)` separately |
| Finance Staff SQL added partial RLS | Broke milestones, payments, expenses across entire app | Never add partial feature SQL — all or nothing |
| `NEW.project_id` in WITH CHECK clause | PostgreSQL error: "missing FROM-clause entry for table new" | Use `table_name.project_id` not `NEW.project_id` in WITH CHECK |
| `is_project_member()` referenced finance_staff | Milestone page crashed: relation "finance_staff" does not exist | Check function body before using — see §7 for current state |
