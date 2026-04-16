# HOW TO BUILD ANY FEATURE — NirmaN
> Use this every time you want to add, fix, or change anything in the app.
> Last updated: April 2026

---

## THE STARTING MESSAGE (Copy This Every Time)

Paste this at the start of every new Claude conversation — no exceptions:

```
Read these two files completely before doing anything:
- /Users/shawon/Desktop/personal-projects/NirmanApp/NIRMAN_CONTEXT.md
- /Users/shawon/Desktop/personal-projects/NirmanApp/AGENT_RULES.md

These are the source of truth for my project. Once you've read both, help me with:

[DESCRIBE YOUR TASK HERE]

---
MANDATORY AFTER COMPLETION:
When the task is fully done, you MUST update NIRMAN_CONTEXT.md:
1. Add a row to the Feature Log (§12) — date, feature name, files changed, DB changes
2. Update App Structure (§5) — add any new files or routes
3. Update Database Schema (§6) — add any new tables, columns, or enums
4. Update FK Reference (§6B) — add any new foreign key relationships
5. Update RLS Policies (§7) — document any new policies
6. Update Business Logic (§8) — document any new workflows
7. Update supabaseAdmin Bypasses (§11) — if any new bypass was added
8. Update Unimplemented Features (§10) — if status changed

Then confirm with:
✅ [Feature name] complete.
Files changed: [list every file]
NIRMAN_CONTEXT.md updated: [list every section updated]
```

---

## HOW TO DESCRIBE YOUR TASK

Be specific. The more context you give, the less back-and-forth.

### Template

```
I want to build: [what it does in plain language]

Who uses it: [Super Admin / Project Admin / Shareholder / All]

Where it lives: [which page or section of the app]

What it should do:
- [action 1]
- [action 2]
- [action 3]

What it should NOT do:
- [any limits or constraints]

Related existing feature: [if it connects to something already built]
```

### Example (Good)

```
I want to build: A way for Project Admins to add notes to any payment record

Who uses it: Project Admin only

Where it lives: Inside the existing payments section, on each payment's detail view

What it should do:
- Admin can type and save a note on any payment
- Note is visible to the admin only (not shareholders)
- Notes can be edited after saving

What it should NOT do:
- Don't let shareholders see notes
- Don't create a separate page — add it to the existing payment detail

Related existing feature: Payments section at /:projectId/payments
```

### Example (Bad — too vague)

```
Add notes to payments
```

---

## THE BUILD PROCESS — STEP BY STEP

### STEP 1 — Agent reads context
The agent reads NIRMAN_CONTEXT.md and AGENT_RULES.md.
**You do nothing. Wait.**

### STEP 2 — Agent announces the plan
Before writing any code, the agent will output:
- What files it will create or change
- Whether the database needs changes
- Who is authorized to use this feature
- Any risks or conflicts with existing features

**You review this plan.**
If something looks wrong, say so before the agent starts coding.
If it looks right, say "go ahead" or just stay silent.

### STEP 3 — Agent builds the feature
The agent writes the code in the correct order:
1. Database changes (if needed)
2. API route
3. Server page
4. Client component
5. UI wired to API

**You do nothing. Wait.**

### STEP 4 — Agent updates the source of truth
After finishing, the agent updates NIRMAN_CONTEXT.md:
- Adds the feature to the Feature Log
- Documents any new files, tables, or policies

**You do nothing. Wait.**

### STEP 5 — Agent confirms completion
The agent will output:

```
✅ [Feature name] complete.
Files changed: [list]
NIRMAN_CONTEXT.md updated: [sections]
```

### STEP 6 — You test it
Test the feature yourself in the browser.
Run the dev server if it's not already running:
```bash
npm run dev
```
Open: http://localhost:3000

Test as each relevant role:
- Does it work for the user who should have access?
- Is it correctly blocked for users who shouldn't?

### STEP 7 — If something is broken
Tell the agent exactly what you see:
```
It's not working. Here's what happens:
- I clicked [button/action]
- Expected: [what should happen]
- Actual: [what actually happened]
- Error message (if any): [paste it]
```

The agent will diagnose and fix it.

---

## TASK TYPES — WHAT TO EXPECT

### New Feature
Agent will: create API route + page + client component + audit log + update context
Time: medium (several steps)

### Bug Fix
Agent will: read the broken code, identify root cause, apply targeted fix
You provide: what's broken, what error you see, which page/action
Time: fast

### UI Change
Agent will: edit the component, use design tokens, no API changes
You provide: what it looks like now, what you want it to look like
Time: fast

### Database Change
Agent will: verify existing schema first, write SQL carefully, update RLS, document
You provide: what data needs to be stored and why
Time: medium — DB changes are careful, not rushed

### New Page
Agent will: choose correct route group, create server + client files, wire to existing APIs
You provide: which role uses it, what data it shows
Time: medium

---

## THINGS THAT SLOW DOWN DEVELOPMENT

| If you do this | What happens |
|----------------|-------------|
| Describe task vaguely | Agent makes assumptions, builds wrong thing, needs rework |
| Skip the starting message | Agent has no context, makes mistakes about RLS, clients, patterns |
| Run SQL in Supabase without telling the agent | Source of truth goes out of sync, bugs appear later |
| Start a new conversation mid-feature | Agent loses context — paste the starting message again |
| Ask for multiple unrelated features at once | Agent mixes them up — one task per conversation |

---

## THINGS THAT SPEED UP DEVELOPMENT

| Do this | Why it helps |
|---------|-------------|
| Use the starting message every time | Agent starts with full context, zero guesswork |
| Review the plan before saying go ahead | Catches wrong assumptions before code is written |
| Give one clear task per conversation | Focused agent = fewer mistakes |
| Tell the agent the role + location + purpose | Agent picks the right auth, client, and route group immediately |
| Report broken things with exact error messages | Agent debugs in one shot instead of guessing |

---

## WHAT NEVER TO DO IN SUPABASE DIRECTLY

These actions in the Supabase dashboard will break things if done without the agent:

| Action | Why it's dangerous |
|--------|--------------------|
| Add a new table without RLS policies | Table is unprotected — anyone can read/write |
| Add `FOR ALL USING(...)` policy | Breaks INSERT operations on that table |
| Reference `finance_staff` in any function or policy | Table doesn't exist — crashes everything that uses the function |
| Delete a table that other tables FK into | Cascade crash across the app |
| Run SQL from an old guide or tutorial | Patterns differ — always go through the agent |

If you must run SQL yourself, tell the agent what you ran so it can update NIRMAN_CONTEXT.md.

---

## QUICK REFERENCE

| I want to... | What to tell the agent |
|-------------|----------------------|
| Add a new section/page | "Build a [name] page for [role] that shows [data]" |
| Fix something broken | "On [page], when I [action], it shows [error]. Expected: [what should happen]" |
| Change how something looks | "On [page], change [element] to look like [description]" |
| Add a new field to a form | "Add [field name] to the [form name] in [page]" |
| Add a new DB table | "I need to store [data]. Here's what it needs: [fields]" |
| Delete a feature | "Remove [feature] from [page]. Keep the rest of the page intact." |
| Change who can access something | "Only [role] should be able to [action]. Currently [role] can also do it." |

---

## FILE LOCATIONS

| File | What it is |
|------|-----------|
| `/Users/shawon/Desktop/personal-projects/NirmanApp/NIRMAN_CONTEXT.md` | Full project context — updated after every feature |
| `/Users/shawon/Desktop/personal-projects/NirmanApp/AGENT_RULES.md` | Rules, checklists, patterns the agent follows |
| `/Users/shawon/Desktop/personal-projects/NirmanApp/HOW_TO_BUILD.md` | This file — your process guide |
| `/Users/shawon/Desktop/personal-projects/NirmanApp/.claude/worktrees/cool-mestorf/` | The actual codebase |
| `.env.local` | Supabase keys — never share or commit this file |
